import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, PartyPopper } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { db } from "@/lib/db";
import { getQueue, whatsappUrl, type QueueItem } from "@/lib/confirmation";
import { formatDZD } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { getCommune, getWilaya, wilayaLabel } from "@/lib/algeria";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill, type Locale } from "@/i18n/config";
import { risksFor } from "@/lib/customers";
import { ConfirmationWorkspace, type CurrentOrder, type QueueRow } from "./workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.confirmation.title };
}

function wilayaText(code: number, locale: Locale) {
  const w = getWilaya(code);
  return w ? wilayaLabel(w, locale) : String(code);
}

function toRow(o: QueueItem, locale: Locale, risk: QueueRow["risk"]): QueueRow {
  return {
    risk,
    id: o.id,
    number: o.number,
    customerName: o.customerName,
    wilaya: wilayaText(o.wilayaCode, locale),
    status: o.status,
    attempts: o.attempts,
    time: formatDateTime(o.status === "CALLBACK" && o.callbackAt ? o.callbackAt : o.createdAt, locale),
  };
}

export default async function ConfirmationPage({ searchParams }: PageProps<"/confirmation">) {
  const sp = await searchParams;
  const requested = typeof sp.id === "string" ? sp.id : "";
  const [t, locale, { queue, upcoming }, settings] = await Promise.all([
    getDictionary(),
    getLocale(),
    getQueue(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true, whatsappTemplate: true } }),
  ]);

  const upcomingList = upcoming.length > 0 && (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <CalendarClock className="size-4" />
        {t.confirm.upcoming}
      </h2>
      <ul className="divide-y rounded-xl border bg-card text-sm">
        {upcoming.map((o) => (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50">
              <span className="min-w-0 truncate">
                <bdi>#{o.number}</bdi> · <bdi>{o.customerName}</bdi>
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{formatDateTime(o.callbackAt!, locale)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  if (queue.length === 0) {
    return (
      <>
        <PageIntro description={t.pages.confirmation.description} />
        <EmptyState icon={PartyPopper} title={t.confirm.emptyTitle} description={t.confirm.emptyText} />
        {upcomingList}
      </>
    );
  }

  const index = Math.max(
    0,
    queue.findIndex((o) => o.id === requested),
  );
  const nextId = queue.length > 1 ? queue[(index + 1) % queue.length].id : null;
  const order = await db.order.findUniqueOrThrow({
    where: { id: queue[index].id },
    include: { items: true, calls: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  const risks = await risksFor(queue.map((o) => o.customerId));
  const commune = getCommune(order.wilayaCode, order.communeId);
  const wilaya = wilayaText(order.wilayaCode, locale);
  const productText = order.items.map((i) => (i.quantity > 1 ? `${i.productName} ×${i.quantity}` : i.productName)).join("، ");

  const template = settings?.whatsappTemplate ?? "";
  const msgLocale: Locale = /[؀-ۿ]/.test(template) ? "ar" : "fr";

  const current: CurrentOrder = {
    id: order.id,
    customerId: order.customerId,
    risk: risks.get(order.customerId),
    number: order.number,
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    wilaya,
    commune: commune ? (locale === "ar" ? commune.nameAr : commune.nameFr) : order.communeName,
    deliveryType: t.deliveryType[order.deliveryType],
    address: order.address,
    items: order.items.map((i) => ({ id: i.id, name: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    attempts: order.attempts,
    duplicate: order.duplicate,
    note: order.note,
    createdAt: formatDateTime(order.createdAt, locale),
    callbackAt: order.callbackAt ? formatDateTime(order.callbackAt, locale) : null,
    calls: order.calls.map((c) => ({ id: c.id, outcome: c.outcome, note: c.note, at: formatDateTime(c.createdAt, locale) })),
    whatsappHref: whatsappUrl(order.phone, template, {
      name: order.customerName,
      store: settings?.storeName ?? "",
      order: `#${order.number}`,
      product: productText,
      // The message goes to the customer: use the template's language, not the dashboard's.
      total: formatDZD(order.total, msgLocale),
      wilaya: wilayaText(order.wilayaCode, msgLocale),
    }),
  };

  return (
    <>
      <PageIntro description={fill(t.confirm.queueCount, { count: queue.length })} />
      <ConfirmationWorkspace current={current} queue={queue.map((o) => toRow(o, locale, risks.get(o.customerId)))} nextId={nextId} />
      {upcomingList}
    </>
  );
}
