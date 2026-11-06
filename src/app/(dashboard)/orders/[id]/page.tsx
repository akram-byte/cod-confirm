import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, Pencil, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/orders";
import { formatDZD } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { getCommune, getWilaya, wilayaLabel } from "@/lib/algeria";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { StatusSelect } from "./status-select";
import { RiskBadge } from "@/components/risk-badge";
import { risksFor } from "@/lib/customers";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [t, order] = await Promise.all([getDictionary(), db.order.findUnique({ where: { id }, select: { number: true } })]);
  return { title: order ? fill(t.orders.detail.title, { number: `#${order.number}` }) : t.orders.notFound };
}

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const [t, locale, order] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.findUnique({
      where: { id },
      include: { items: true, calls: { orderBy: { createdAt: "desc" } } },
    }),
  ]);
  if (!order) notFound();
  const risk = (await risksFor([order.customerId])).get(order.customerId);

  const wilaya = getWilaya(order.wilayaCode);
  const commune = getCommune(order.wilayaCode, order.communeId);
  const communeName = commune ? (locale === "ar" ? commune.nameAr : commune.nameFr) : order.communeName;
  const money = (n: number) => formatDZD(n, locale);
  const d = t.orders.detail;

  const history = [
    { label: d.createdAt, at: order.createdAt },
    { label: d.confirmedAt, at: order.confirmedAt },
    { label: d.cancelledAt, at: order.cancelledAt },
    { label: d.shippedAt, at: order.shippedAt },
    { label: d.deliveredAt, at: order.deliveredAt },
    { label: d.returnedAt, at: order.returnedAt },
  ].filter((h): h is { label: string; at: Date } => !!h.at);

  return (
    <>
      <BackLink href="/orders" label={t.common.back} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{fill(d.title, { number: `#${order.number}` })}</h1>
          <StatusBadge status={order.status} label={t.status[order.status]} />
          {order.duplicate && (
            <span
              title={t.orders.duplicateHint}
              className="inline-flex h-6 items-center gap-1 rounded-full bg-[var(--pill-warning-bg)] px-2.5 text-xs font-medium text-[var(--pill-warning-ink)]"
            >
              <Copy className="size-3" />
              {t.orders.duplicate}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect key={order.status} orderId={order.id} status={order.status} statuses={ORDER_STATUSES} />
          <a href={`tel:${order.phone}`} className={buttonVariants({ variant: "outline" })}>
            <Phone className="size-4" />
            {d.call}
          </a>
          <Link href={`/orders/${order.id}/edit`} className={buttonVariants()}>
            <Pencil className="size-4" />
            {t.common.edit}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{d.customer}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/customers/${order.customerId}`} className="font-medium hover:underline">
                    {order.customerName}
                  </Link>
                  <RiskBadge risk={risk} labels={t.risk} />
                </div>
                <a href={`tel:${order.phone}`} dir="ltr" className="block text-sm hover:underline rtl:text-right">
                  {order.phone}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{d.delivery}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{wilaya ? wilayaLabel(wilaya, locale) : order.wilayaCode}</p>
                <p>{communeName}</p>
                <p className="text-muted-foreground">{t.deliveryType[order.deliveryType]}</p>
                {order.address && <p className="text-muted-foreground">{order.address}</p>}
                {order.trackingNumber && (
                  <p>
                    <span className="text-muted-foreground">{d.tracking}: </span>
                    <span dir="ltr">{order.trackingNumber}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{d.items}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                    <div>
                      <p className="font-medium">{i.productName}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {i.quantity} × {money(i.unitPrice)}
                      </p>
                    </div>
                    <span className="tabular-nums">{money(i.quantity * i.unitPrice)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.orderFields.subtotal}</dt>
                  <dd className="tabular-nums">{money(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.orderFields.deliveryFee}</dt>
                  <dd className="tabular-nums">{money(order.deliveryFee)}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt>{t.orderFields.total}</dt>
                  <dd className="tabular-nums">{money(order.total)}</dd>
                </div>
              </dl>
              {order.note && <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">{order.note}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{d.history}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {history.map((h) => (
                  <div key={h.label} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{h.label}</dt>
                    <dd className="tabular-nums">{formatDateTime(h.at, locale)}</dd>
                  </div>
                ))}
                {order.status === "CALLBACK" && order.callbackAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{d.callbackAt}</dt>
                    <dd className="tabular-nums">{formatDateTime(order.callbackAt, locale)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{d.source}</dt>
                  <dd>{t.source[order.source]}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{d.attempts}</dt>
                  <dd className="tabular-nums">{order.attempts}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{d.calls}</CardTitle>
            </CardHeader>
            <CardContent>
              {order.calls.length === 0 ? (
                <p className="text-sm text-muted-foreground">{d.noCalls}</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {order.calls.map((c) => (
                    <li key={c.id}>
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{t.status[c.outcome]}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(c.createdAt, locale)}</span>
                      </div>
                      {c.note && <p className="text-muted-foreground">{c.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
