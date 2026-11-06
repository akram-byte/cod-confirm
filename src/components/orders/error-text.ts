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
  for (const [field, value] of Object.entries(errors ?? {})) {
    if (!value) continue;
    const key = FIELD_KEY[field as keyof typeof FIELD_KEY];
    out[field] = key ? t.orderFields.errors[key] : t.common.error;
  }
  return out;
}

/** Removes one field's error once the user edits that field. */
export function withoutError<S extends { ok: boolean; errors?: Partial<Record<string, string>> } | null>(
  state: S,
  fields: string[],
): S {
  if (!state || state.ok || !state.errors || !fields.some((f) => state.errors![f])) return state;
  const errors = { ...state.errors };
  for (const f of fields) delete errors[f];
  return { ...state, errors };
}
