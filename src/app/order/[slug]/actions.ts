"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { baseUrl } from "@/lib/base-url";
import { notifyNewOrder } from "@/lib/telegram";
import { createOrder, fieldErrors, orderInputSchema, type FieldErrors } from "@/lib/orders";
import { clientIp, hit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { saveDraft } from "@/lib/drafts";
import { z } from "zod";

export type PublicOrderState =
  | { ok: true; number: number; id: string; total: number; track: string }
  | { ok: false; errors?: FieldErrors; error?: "tooMany" | "unavailable" | "unknown" };

// 5 orders per device (IP) every 15 minutes.
const MAX_ORDERS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function submitPublicOrder(formData: FormData): Promise<PublicOrderState> {
  // Honeypot: real people never see this field. Bots fill it — pretend it worked.
  if (String(formData.get("website") ?? "").trim() !== "") return { ok: true, number: 0, id: "", total: 0, track: "" };

  const parsed = orderInputSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    wilayaCode: formData.get("wilayaCode"),
    communeId: formData.get("communeId"),
    deliveryType: formData.get("deliveryType"),
    address: formData.get("address") ?? "",
    note: "",
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  if (await hit(`order:${await clientIp()}`, MAX_ORDERS, WINDOW_MS)) return { ok: false, error: "tooMany" };

  try {
    const fill = Number(formData.get("fillMs"));
    const device = String(formData.get("deviceId") ?? "");
    const result = await createOrder(parsed.data, "FORM", {
      signals: {
        // Missing or odd values (no JavaScript, old page) give no signal rather than a false alarm.
        fillSeconds: Number.isFinite(fill) && fill > 0 && fill < 86_400_000 ? Math.round(fill / 1000) : null,
        deviceId: /^[A-Za-z0-9]{16,64}$/.test(device) ? device : null,
      },
    });
    if ("error" in result) {
      if (result.error === "product") return { ok: false, error: "unavailable" };
      return { ok: false, errors: { [result.error === "commune" ? "communeId" : "wilayaCode"]: result.error } };
    }
    revalidatePath("/orders");
    // Telegram alert after the reply is sent: the customer never waits for it.
    const base = await baseUrl();
    after(() => notifyNewOrder(result.id, base).catch((e) => console.error("telegram alert failed", e)));
    return { ok: true, number: result.number, id: result.id, total: result.total, track: result.trackToken };
  } catch (e) {
    console.error("public order failed", e);
    return { ok: false, error: "unknown" };
  }
}

const draftSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  productId: z.string().min(1).max(40),
  phone: z.string().max(20),
  customerName: z.string().trim().max(80),
  wilayaCode: z.coerce.number().int().min(1).max(99).nullable(),
  communeId: z.coerce.number().int().min(1).nullable(),
  quantity: z.coerce.number().int().min(1).max(99),
});

/** Saves what the customer typed once the phone is valid (abandoned orders). Silent: never blocks the form. */
export async function savePublicDraft(input: z.input<typeof draftSchema>): Promise<void> {
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return;
  // A form visit saves a few times while typing; 30 saves per device every 15 minutes is plenty.
  if (await hit(`draft:${await clientIp()}`, 30, WINDOW_MS)) return;
  try {
    await saveDraft({ ...parsed.data, phone, customerName: parsed.data.customerName || null });
  } catch (e) {
    console.error("save draft failed", e);
  }
}
