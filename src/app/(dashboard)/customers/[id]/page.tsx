import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/back-link";
import { RiskBadge } from "@/components/risk-badge";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { riskOf, statsFor } from "@/lib/customers";
import { formatDZD } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { toInternational } from "@/lib/phone";
import { getWilaya, wilayaLabel } from "@/lib/algeria";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { BlacklistButton, CustomerNote } from "./customer-actions";

export async function generateMetadata({ params }: PageProps<"/customers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [t, c] = await Promise.all([getDictionary(), db.customer.findUnique({ where: { id }, select: { name: true } })]);
  return { title: c?.name ?? t.customers.notFound };
}

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const [t, locale, customer] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: { select: { productName: true, quantity: true } }, calls: { select: { id: true } } },
        },
      },
    }),
  ]);
  if (!customer) notFound();

  const stats = (await statsFor([customer.id])).get(customer.id) ?? { total: 0, delivered: 0, returned: 0, cancelled: 0 };
  const risk = riskOf(customer.blacklisted, stats);
  const cards = [
    { label: t.customers.columns.orders, value: stats.total },
    { label: t.customers.columns.delivered, value: stats.delivered, cls: "text-emerald-700 dark:text-emerald-400" },
    { label: t.customers.columns.returned, value: stats.returned, cls: stats.returned ? "text-red-600 dark:text-red-400" : "" },
    { label: t.customers.columns.cancelled, value: stats.cancelled, cls: stats.cancelled ? "text-amber-700 dark:text-amber-400" : "" },
  ];

  return (
    <>
      <BackLink href="/customers" label={t.common.back} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{customer.name}</h2>
            <RiskBadge risk={risk} labels={t.risk} className="h-6 px-2.5" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span dir="ltr">{customer.phone}</span> · {fill(t.customers.since, { date: formatDate(customer.createdAt, locale) })}
          </p>
          {customer.blacklisted && customer.blacklistReason && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              {t.customers.reason}: {customer.blacklistReason}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${customer.phone}`} className={buttonVariants({ variant: "outline" })}>
            <Phone className="size-4" />
            {t.confirm.call}
          </a>
          <a
            href={`https://wa.me/${toInternational(customer.phone)}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <MessageCircle className="size-4" />
            {t.confirm.whatsapp}
          </a>
          <BlacklistButton customerId={customer.id} blacklisted={customer.blacklisted} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className={cn("text-2xl font-semibold tabular-nums", c.cls)}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t.customers.history}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {customer.orders.map((o) => {
                const w = getWilaya(o.wilayaCode);
                return (
                  <li key={o.id}>
                    <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="font-medium">
                          #{o.number} · <span className="font-normal">{o.items.map((i) => i.productName).join("، ")}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(o.createdAt, locale)} · {w ? wilayaLabel(w, locale) : o.wilayaCode}
                          {o.calls.length > 0 && ` · ${t.confirm.attempts}: ${o.attempts}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums">{formatDZD(o.total, locale)}</span>
                        <StatusBadge status={o.status} label={t.status[o.status]} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t.customers.note}</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerNote customerId={customer.id} note={customer.note ?? ""} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
