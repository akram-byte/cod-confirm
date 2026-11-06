import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageIntro } from "@/components/page-intro";
import { db } from "@/lib/db";
import { getDictionary, getLocale } from "@/i18n/server";
import { formatDZD } from "@/lib/money";
import { ProductsSection } from "./products-section";
import { WhatsappSection } from "./whatsapp-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.settings.title };
}

export default async function SettingsPage() {
  const [t, locale, h, settings, products] = await Promise.all([
    getDictionary(),
    getLocale(),
    headers(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true, whatsappTemplate: true } }),
    db.product.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { items: true } } },
    }),
  ]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return (
    <>
      <PageIntro description={t.pages.settings.description} />
      <div className="space-y-6">
        <ProductsSection
          baseUrl={`${proto}://${host}`}
          products={products.map(({ _count, ...p }) => ({ ...p, orderCount: _count.items }))}
        />
        <WhatsappSection
          template={settings?.whatsappTemplate ?? ""}
          sample={{
            name: locale === "ar" ? "محمد بن علي" : "Mohamed Benali",
            store: settings?.storeName ?? "",
            order: "#1024",
            product: products[0]?.name ?? "—",
            total: formatDZD(products[0] ? products[0].price + 400 : 0, locale),
            wilaya: locale === "ar" ? "16 - الجزائر" : "16 - Alger",
          }}
        />
      </div>
    </>
  );
}
