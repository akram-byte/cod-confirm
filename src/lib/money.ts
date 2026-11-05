// Money is stored as integers in DZD. Format for display only.
export function formatDZD(amount: number, locale: "ar" | "fr"): string {
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-DZ-u-nu-latn" : "fr-DZ", {
    maximumFractionDigits: 0,
  }).format(amount);
  return locale === "ar" ? `${n} د.ج` : `${n} DA`;
}
