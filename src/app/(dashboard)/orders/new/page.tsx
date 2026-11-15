import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/server";
import { BackLink } from "@/components/back-link";
import { OrderEditor } from "../order-editor";
import { editorData } from "../editor-data";
import { getDraft } from "@/lib/drafts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.orders.editor.newTitle };
}

export default async function NewOrderPage({ searchParams }: PageProps<"/orders/new">) {
  const sp = await searchParams;
  const [t, locale, draft] = await Promise.all([
    getDictionary(),
    getLocale(),
    // Coming from an abandoned order form: start with what the customer typed.
    typeof sp.draft === "string" ? getDraft(sp.draft) : null,
  ]);
  const { products, fees, wilayas } = await editorData(locale);
  const fromDraft = draft && products.some((p) => p.id === draft.productId) ? draft : null;
  const draftFee = fromDraft?.wilayaCode ? (fees[fromDraft.wilayaCode]?.home ?? 0) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/orders" label={t.common.back} />
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">{t.orders.editor.newTitle}</h1>
      <OrderEditor
        orderId={null}
        cancelHref="/orders"
        products={products}
        wilayas={wilayas}
        fees={fees}
        initial={{
          productId: fromDraft?.productId ?? (products.length === 1 ? products[0].id : ""),
          quantity: fromDraft?.quantity ?? 1,
          customerName: fromDraft?.customerName ?? "",
          phone: fromDraft?.phone ?? "",
          location: {
            wilayaCode: fromDraft?.wilayaCode ? String(fromDraft.wilayaCode) : "",
            communeId: fromDraft?.communeId ? String(fromDraft.communeId) : "",
            deliveryType: "HOME",
            address: "",
          },
          deliveryFee: draftFee,
          note: "",
        }}
      />
    </div>
  );
}
