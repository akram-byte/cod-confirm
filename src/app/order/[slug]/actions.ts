"use server";

import { revalidatePath } from "next/cache";
import { createOrder, fieldErrors, orderInputSchema, type FieldErrors } from "@/lib/orders";
import { clientIp, hit } from "@/lib/rate-limit";

export type PublicOrderState =
  | { ok: true; number: number; id: string; total: number }
  | { ok: false; errors?: FieldErrors; error?: "tooMany" | "unavailable" | "unknown" };

// 5 orders per device (IP) every 15 minutes.
const MAX_ORDERS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function submitPublicOrder(formData: FormData): Promise<PublicOrderState> {
  // Honeypot: real people never see this field. Bots fill it — pretend it worked.
  if (String(formData.get("website") ?? "").trim() !== "") return { ok: true, number: 0, id: "", total: 0 };

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

  if (hit(`order:${await clientIp()}`, MAX_ORDERS, WINDOW_MS)) return { ok: false, error: "tooMany" };

  try {
    const result = await createOrder(parsed.data, "FORM");
    if ("error" in result) {
      if (result.error === "product") return { ok: false, error: "unavailable" };
      return { ok: false, errors: { [result.error === "commune" ? "communeId" : "wilayaCode"]: result.error } };
    }
    revalidatePath("/orders");
    return { ok: true, number: result.number, id: result.id, total: result.total };
  } catch (e) {
    console.error("public order failed", e);
    return { ok: false, error: "unknown" };
  }
}
