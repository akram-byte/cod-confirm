import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/server";
import { BackLink } from "@/components/back-link";
import { OrderEditor } from "../order-editor";
import { editorData } from "../editor-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.orders.editor.newTitle };
}

export default async function NewOrderPage() {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { products, fees, wilayas } = await editorData(locale);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/orders" label={t.common.back} />
      <h2 className="mb-4 text-lg font-semibold">{t.orders.editor.newTitle}</h2>
      <OrderEditor
        orderId={null}
        cancelHref="/orders"
        products={products}
        wilayas={wilayas}
        fees={fees}
        initial={{
          productId: products.length === 1 ? products[0].id : "",
          quantity: 1,
          customerName: "",
          phone: "",
          location: { wilayaCode: "", communeId: "", deliveryType: "HOME", address: "" },
          deliveryFee: 0,
          note: "",
        }}
      />
    </div>
  );
}
