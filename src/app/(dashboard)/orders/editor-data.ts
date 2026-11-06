import "server-only";
import { db } from "@/lib/db";
import { feeTable } from "@/lib/orders";
import { wilayaOptions } from "@/lib/wilaya-options";
import type { Locale } from "@/i18n/config";

/** Products, wilayas and fees needed by the order editor. */
export async function editorData(locale: Locale, keepProductId?: string) {
  const [products, fees] = await Promise.all([
    db.product.findMany({
      where: keepProductId ? { OR: [{ active: true }, { id: keepProductId }] } : { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, price: true, active: true },
    }),
    feeTable(),
  ]);
  return { products, fees, wilayas: wilayaOptions(locale) };
}
