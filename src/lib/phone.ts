// Algerian mobile numbers: 05 / 06 / 07 followed by 8 digits.
// Accepts +213, 00213 and spaces/dashes, and returns the local 0XXXXXXXXX form.
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+213")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("00213")) digits = "0" + digits.slice(5);
  else if (digits.startsWith("213") && digits.length === 12) digits = "0" + digits.slice(3);
  return /^0[567]\d{8}$/.test(digits) ? digits : null;
}

// For wa.me links: 0661234567 → 213661234567
export function toInternational(phone: string): string {
  return "213" + phone.replace(/^0/, "");
}
