import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Banknote } from "lucide-react";
import { db } from "@/lib/db";
import { feeTable } from "@/lib/orders";
import { formatDZD } from "@/lib/money";
import { wilayaOptions } from "@/lib/wilaya-options";
import { getDictionary, getLocale } from "@/i18n/server";
import { LanguageToggle } from "@/components/language-toggle";
import { Pixels } from "@/components/pixels";
import { PublicOrderForm } from "./order-form";

const getProduct = cache((slug: string) =>
  db.product.findUnique({ where: { slug }, select: { id: true, name: true, description: true, price: true, active: true } }),
);

export async function generateMetadata({ params }: PageProps<"/order/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [product, t] = await Promise.all([getProduct(slug), getDictionary()]);
  return { title: product?.active ? product.name : t.publicOrder.notFoundTitle, robots: { index: false } };
}

export default async function PublicOrderPage({ params }: PageProps<"/order/[slug]">) {
  const { slug } = await params;
  const [product, t, locale, settings] = await Promise.all([
    getProduct(slug),
    getDictionary(),
    getLocale(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true, fbPixelId: true, tiktokPixelId: true } }),
  ]);
  if (!product || !product.active) notFound();

  const fees = await feeTable();
  const wilayas = wilayaOptions(locale, new Set(Object.keys(fees).map(Number)));
  const pixelProduct = { id: product.id, name: product.name, price: product.price };

  return (
    <main className="min-h-svh bg-muted/40 px-4 py-6 sm:py-10">
      <Pixels fb={settings?.fbPixelId ?? ""} tiktok={settings?.tiktokPixelId ?? ""} product={pixelProduct} />
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{settings?.storeName}</p>
          <LanguageToggle />
        </div>
        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h1 className="text-xl font-semibold">{product.name}</h1>
            {product.description && <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold tabular-nums">{formatDZD(product.price, locale)}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pill-positive-bg)] px-2.5 py-1 text-xs font-medium text-[var(--pill-positive-ink)]">
                <Banknote className="size-3.5" />
                {t.publicOrder.payOnDelivery}
              </span>
            </div>
          </div>
          <div className="relative p-5">
            <h2 className="mb-4 text-base font-semibold">{t.publicOrder.title}</h2>
            <PublicOrderForm product={pixelProduct} wilayas={wilayas} fees={fees} />
          </div>
        </div>
      </div>
    </main>
  );
}
