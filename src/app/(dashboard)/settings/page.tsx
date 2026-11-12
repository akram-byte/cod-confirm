import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageIntro } from "@/components/page-intro";
import { db } from "@/lib/db";
import { getDictionary, getLocale } from "@/i18n/server";
import { formatDZD } from "@/lib/money";
import { ProductsSection } from "./products-section";
import { WhatsappSection } from "./whatsapp-section";
import { PixelsSection } from "./pixels-section";
import { TelegramSection } from "./telegram-section";
import { telegramEnabled } from "@/lib/telegram";
import { DeliveryFeesSection, PasswordSection, StoreNameSection } from "./store-sections";
import { WILAYAS, wilayaLabel } from "@/lib/algeria";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.settings.title };
}

export default async function SettingsPage() {
  const [t, locale, h, settings, products, fees] = await Promise.all([
    getDictionary(),
    getLocale(),
    headers(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true, whatsappTemplate: true, fbPixelId: true, tiktokPixelId: true, telegramChatId: true, telegramDaily: true } }),
    db.product.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { items: true } } },
    }),
    db.deliveryFee.findMany(),
  ]);
  const feeMap = new Map(fees.map((f) => [f.wilayaCode, f]));
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return (
    <>
      <PageIntro title={t.pages.settings.title} description={t.pages.settings.description} />
      <div className="space-y-6">
        <StoreNameSection name={settings?.storeName ?? ""} />
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
        <TelegramSection enabled={telegramEnabled()} connected={!!settings?.telegramChatId} daily={settings?.telegramDaily ?? true} />
        <PixelsSection fb={settings?.fbPixelId ?? ""} tiktok={settings?.tiktokPixelId ?? ""} />
        <DeliveryFeesSection
          rows={WILAYAS.map((w) => {
            const f = feeMap.get(w.code);
            return {
              wilayaCode: w.code,
              label: wilayaLabel(w, locale),
              homeFee: f?.homeFee ?? 0,
              deskFee: f?.deskFee ?? 0,
              active: f?.active ?? false,
            };
          })}
        />
        <PasswordSection />
      </div>
    </>
  );
}
