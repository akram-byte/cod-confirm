import type { Dictionary } from "@/i18n/ar";

const FIELD_KEY = {
  productId: "product",
  quantity: "quantity",
  customerName: "name",
  phone: "phone",
  wilayaCode: "wilaya",
  communeId: "commune",
  deliveryFee: "deliveryFee",
} as const;

/** Turns server field errors ({ phone: "..." }) into translated messages. */
export function translateErrors(
  t: Dictionary,
  errors: Partial<Record<string, string>> | undefined,
): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const field of Object.keys(errors ?? {})) {
    const key = FIELD_KEY[field as keyof typeof FIELD_KEY];
    out[field] = key ? t.orderFields.errors[key] : t.common.error;
  }
  return out;
}
