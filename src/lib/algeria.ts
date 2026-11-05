import data from "@/data/algeria.json";

// 69 wilayas / 1541 communes — Journal Officiel N° 25 (5 April 2026), Law 26-06.
// Source dataset: github.com/islam-re/Algeria-wilayas (MIT).

export type Commune = { id: number; nameAr: string; nameFr: string };
export type Wilaya = { code: number; nameAr: string; nameFr: string; communes: Commune[] };

export const WILAYAS = data as Wilaya[];

export function getWilaya(code: number): Wilaya | undefined {
  return WILAYAS.find((w) => w.code === code);
}

export function getCommune(wilayaCode: number, communeId: number): Commune | undefined {
  return getWilaya(wilayaCode)?.communes.find((c) => c.id === communeId);
}

export function wilayaLabel(w: Pick<Wilaya, "code" | "nameAr" | "nameFr">, locale: "ar" | "fr") {
  const code = String(w.code).padStart(2, "0");
  return `${code} - ${locale === "ar" ? w.nameAr : w.nameFr}`;
}
