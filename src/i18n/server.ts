import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { ar } from "./ar";
import { fr } from "./fr";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

const dictionaries = { ar, fr };

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
