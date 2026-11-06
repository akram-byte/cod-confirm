"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import {
  ORDER_STATUSES,
  createOrder,
  fieldErrors,
  findDuplicate,
  orderInputSchema,
  setOrderStatus,
  updateOrder,
  type FieldErrors,
} from "@/lib/orders";

export type SaveOrderState =
  | { ok: true; id: string; number?: number }
  | { ok: false; errors?: FieldErrors & { deliveryFee?: string }; duplicateOf?: number; error?: "unknown" | "notFound" };

const feeSchema = z.coerce.number().int().min(0).max(100_000);

function parse(formData: FormData) {
  return orderInputSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    wilayaCode: formData.get("wilayaCode"),
    communeId: formData.get("communeId"),
    deliveryType: formData.get("deliveryType"),
    address: formData.get("address") ?? "",
    note: formData.get("note") ?? "",
  });
}

/** Create (id = null) or update an order from the dashboard. */
export async function saveOrder(id: string | null, formData: FormData, force: boolean): Promise<SaveOrderState> {
  await requireOwner();
  const parsed = parse(formData);
  const fee = feeSchema.safeParse(formData.get("deliveryFee"));
  if (!parsed.success || !fee.success) {
    return {
      ok: false,
      errors: { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...(fee.success ? {} : { deliveryFee: "deliveryFee" }) },
    };
  }

  try {
    if (!id && !force) {
      const dup = await findDuplicate(parsed.data.phone, parsed.data.productId);
      if (dup) return { ok: false, duplicateOf: dup.number };
    }
    const result = id
      ? await updateOrder(id, parsed.data, fee.data)
      : await createOrder(parsed.data, "MANUAL", { feeOverride: fee.data });
    if ("error" in result) {
      if (result.error === "notFound") return { ok: false, error: "notFound" };
      const field = result.error === "product" ? "productId" : result.error === "commune" ? "communeId" : "wilayaCode";
      return { ok: false, errors: { [field]: result.error } };
    }
    revalidatePath("/orders", "layout");
    return "number" in result ? { ok: true, id: result.id, number: result.number } : { ok: true, id: id! };
  } catch (e) {
    console.error("save order failed", e);
    return { ok: false, error: "unknown" };
  }
}

export async function changeOrderStatus(id: string, status: string) {
  await requireOwner();
  const parsed = z.enum(ORDER_STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false };
  try {
    await setOrderStatus(id, parsed.data);
    revalidatePath("/orders", "layout");
    return { ok: true };
  } catch (e) {
    console.error("change status failed", e);
    return { ok: false };
  }
}
