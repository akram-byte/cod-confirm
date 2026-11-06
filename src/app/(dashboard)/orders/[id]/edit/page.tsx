import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { BackLink } from "@/components/back-link";
import { OrderEditor } from "../../order-editor";
import { editorData } from "../../editor-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.orders.title };
}

export default async function EditOrderPage({ params }: PageProps<"/orders/[id]/edit">) {
  const { id } = await params;
  const [t, locale, order] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.findUnique({ where: { id }, include: { items: true } }),
  ]);
  if (!order) notFound();
  const item = order.items[0];
  const { products, fees, wilayas } = await editorData(locale, item?.productId ?? undefined);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={`/orders/${order.id}`} label={t.common.back} />
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">{fill(t.orders.editor.editTitle, { number: `#${order.number}` })}</h1>
      <OrderEditor
        orderId={order.id}
        cancelHref={`/orders/${order.id}`}
        products={products}
        wilayas={wilayas}
        fees={fees}
        initial={{
          productId: item?.productId ?? "",
          quantity: item?.quantity ?? 1,
          customerName: order.customerName,
          phone: order.phone,
          location: {
            wilayaCode: String(order.wilayaCode),
            communeId: String(order.communeId),
            deliveryType: order.deliveryType,
            address: order.address ?? "",
          },
          deliveryFee: order.deliveryFee,
          note: order.note ?? "",
          unitPrice: item?.unitPrice,
        }}
      />
    </div>
  );
}
