import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { db } from "@/lib/db";
import { getRescueQueue } from "@/lib/rescue";
import { whatsappUrl } from "@/lib/confirmation";
import { risksFor } from "@/lib/customers";
import { formatAgo } from "@/lib/format";
import { formatDZD } from "@/lib/money";
import { getCommune, getWilaya, wilayaLabel } from "@/lib/algeria";
import { getCourier, syncInBackgroundIfStale } from "@/lib/courier";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill, type Locale } from "@/i18n/config";
import { ar } from "@/i18n/ar";
import { fr } from "@/i18n/fr";
import { RescueList, type RescueRow } from "./rescue-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.rescue.title };
}

export default async function RescuePage() {
  const [t, locale, orders, settings] = await Promise.all([
    getDictionary(),
    getLocale(),
    getRescueQueue(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true, whatsappTemplate: true, courierSyncedAt: true } }),
  ]);
  if (getCourier()) syncInBackgroundIfStale(settings?.courierSyncedAt ?? null);

  // The message goes to the customer: same language as the seller's WhatsApp template.
  const msgLocale: Locale = /[؀-ۿ]/.test(settings?.whatsappTemplate ?? "") || !settings?.whatsappTemplate ? "ar" : "fr";
  const template = (msgLocale === "ar" ? ar : fr).rescue.whatsapp;
  const risks = await risksFor(orders.map((o) => o.customerId));

  const rows: RescueRow[] = orders.map((o) => {
    const w = getWilaya(o.wilayaCode);
    const commune = getCommune(o.wilayaCode, o.communeId);
    const products = o.items.map((i) => (i.quantity > 1 ? `${i.productName} ×${i.quantity}` : i.productName)).join("، ");
    return {
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      phone: o.phone,
      risk: risks.get(o.customerId),
      place: [w ? wilayaLabel(w, locale) : String(o.wilayaCode), commune ? (locale === "ar" ? commune.nameAr : commune.nameFr) : o.communeName].join(" · "),
      deliveryType: o.deliveryType === "DESK" ? `${t.deliveryType.DESK}${o.stopDeskName ? ` · ${o.stopDeskName}` : ""}` : t.deliveryType.HOME,
      products,
      total: o.total,
      deliveryFee: o.deliveryFee,
      tracking: o.trackingNumber ?? "",
      courierStatus: o.courierStatus ?? "",
      failedAgo: o.failedAt ? formatAgo(o.failedAt, locale) : "",
      noAnswer: o.rescueResult === "NO_ANSWER" ? o.rescueCalls : 0,
      lastNote: o.rescueNote ?? "",
      whatsappHref: whatsappUrl(o.phone, template, {
        name: o.customerName,
        store: settings?.storeName ?? "",
        order: `#${o.number}`,
        product: products,
        total: formatDZD(o.total, msgLocale),
        wilaya: w ? wilayaLabel(w, msgLocale) : String(o.wilayaCode),
      }),
    };
  });
  const atStake = rows.reduce((s, r) => s + r.total, 0);

  return (
    <>
      <PageIntro
        title={t.pages.rescue.title}
        description={rows.length > 0 ? fill(t.rescue.count, { count: rows.length, value: formatDZD(atStake, locale) }) : t.pages.rescue.description}
      />
      {rows.length === 0 ? (
        <EmptyState icon={LifeBuoy} title={t.rescue.emptyTitle} description={t.rescue.emptyText} />
      ) : (
        <RescueList rows={rows} />
      )}
    </>
  );
}
