import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { db } from "@/lib/db";
import { getAbandoned } from "@/lib/drafts";
import { whatsappUrl } from "@/lib/confirmation";
import { formatAgo } from "@/lib/format";
import { formatDZD } from "@/lib/money";
import { getCommune, getWilaya, wilayaLabel } from "@/lib/algeria";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill, type Locale } from "@/i18n/config";
import { ar } from "@/i18n/ar";
import { fr } from "@/i18n/fr";
import { AbandonedList, type AbandonedRow } from "./abandoned-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.abandoned.title };
}

export default async function AbandonedPage() {
  const [t, locale, drafts, settings] = await Promise.all([
    getDictionary(),
    getLocale(),
    getAbandoned(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true, whatsappTemplate: true } }),
  ]);

  // The message goes to the customer: same language as the seller's WhatsApp template.
  const msgLocale: Locale = /[؀-ۿ]/.test(settings?.whatsappTemplate ?? "") || !settings?.whatsappTemplate ? "ar" : "fr";
  const template = (msgLocale === "ar" ? ar : fr).abandoned.whatsapp;

  const rows: AbandonedRow[] = drafts.map((d) => {
    const w = d.wilayaCode ? getWilaya(d.wilayaCode) : undefined;
    const c = d.wilayaCode && d.communeId ? getCommune(d.wilayaCode, d.communeId) : undefined;
    const product = d.quantity > 1 ? `${d.product.name} ×${d.quantity}` : d.product.name;
    return {
      id: d.id,
      customerName: d.customerName ?? "",
      phone: d.phone,
      product,
      value: d.product.price * d.quantity,
      place: [w && wilayaLabel(w, locale), c && (locale === "ar" ? c.nameAr : c.nameFr)].filter(Boolean).join(" · "),
      ago: formatAgo(d.updatedAt, locale),
      noAnswer: d.status === "NO_ANSWER" ? d.attempts : 0,
      whatsappHref: whatsappUrl(d.phone, template, {
        name: d.customerName ?? "",
        store: settings?.storeName ?? "",
        order: "",
        product,
        total: formatDZD(d.product.price * d.quantity, msgLocale),
        wilaya: w ? wilayaLabel(w, msgLocale) : "",
      }),
    };
  });
  const value = rows.reduce((s, r) => s + r.value, 0);

  return (
    <>
      <BackLink href="/confirmation" label={t.pages.confirmation.title} />
      <PageIntro
        title={t.abandoned.title}
        description={rows.length > 0 ? fill(t.abandoned.count, { count: rows.length, value: formatDZD(value, locale) }) : t.abandoned.description}
      />
      {rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={t.abandoned.emptyTitle} description={t.abandoned.emptyText} />
      ) : (
        <AbandonedList rows={rows} />
      )}
    </>
  );
}
