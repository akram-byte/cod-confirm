import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, Plus, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { StatusBadge } from "@/components/status-badge";
import { RiskBadge } from "@/components/risk-badge";
import { risksFor } from "@/lib/customers";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/orders";
import { formatDZD } from "@/lib/money";
import { formatDateTime, startOfDay } from "@/lib/format";
import { WILAYAS, getWilaya, wilayaLabel } from "@/lib/algeria";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { OrderFilters } from "./filters";

const PAGE_SIZE = 25;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.orders.title };
}

function str(v: string | string[] | undefined) {
  return typeof v === "string" ? v.trim() : "";
}

function buildWhere(sp: Record<string, string | string[] | undefined>): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const q = str(sp.q).replace(/^#/, "");
  if (q) {
    const digits = q.replace(/[\s\-+]/g, "");
    const or: Prisma.OrderWhereInput[] = [{ customerName: { contains: q, mode: "insensitive" } }];
    if (/^\d+$/.test(digits)) {
      if (digits.length <= 7) or.push({ number: Number(digits) });
      or.push({ phone: { contains: digits.replace(/^213/, "0") } });
    }
    where.OR = or;
  }
  const status = str(sp.status);
  if ((ORDER_STATUSES as readonly string[]).includes(status)) where.status = status as OrderStatus;
  const product = str(sp.product);
  if (product) where.items = { some: { productId: product } };
  const wilaya = Number(str(sp.wilaya));
  if (wilaya) where.wilayaCode = wilaya;
  const from = startOfDay(str(sp.from));
  const to = startOfDay(str(sp.to));
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: from }),
      ...(to && { lt: new Date(to.getTime() + 86_400_000) }),
    };
  }
  return where;
}

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const sp = await searchParams;
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const where = buildWhere(sp);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const [orders, total, products] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { productName: true, quantity: true } } },
    }),
    db.order.count({ where }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const risks = await risksFor(orders.map((o) => o.customerId));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Object.keys(sp).some((k) => k !== "page" && str(sp[k]));

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) next.set(k, v);
    next.set("page", String(p));
    return `/orders?${next}`;
  };

  const rows = orders.map((o) => {
    const w = getWilaya(o.wilayaCode);
    return {
      ...o,
      wilaya: w ? wilayaLabel(w, locale) : String(o.wilayaCode),
      risk: risks.get(o.customerId),
      productText: o.items.map((i) => (i.quantity > 1 ? `${i.productName} ×${i.quantity}` : i.productName)).join("، "),
    };
  });

  return (
    <>
      <PageIntro description={t.pages.orders.description}>
        <Link href="/orders/new" className={buttonVariants()}>
          <Plus className="size-4" />
          {t.orders.newOrder}
        </Link>
      </PageIntro>

      <OrderFilters
        statuses={ORDER_STATUSES.map((s) => ({ value: s, label: t.status[s] }))}
        products={products}
        wilayas={WILAYAS.map((w) => ({ code: w.code, label: wilayaLabel(w, locale) }))}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t.orders.emptyTitle}
          description={filtered ? t.orders.emptyFiltered : t.orders.emptyText}
        />
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">{fill(t.orders.count, { count: total })}</p>

          {/* Mobile: cards */}
          <ul className="space-y-2 md:hidden">
            {rows.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="block rounded-xl border bg-card p-3 active:bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      <bdi>#{o.number}</bdi> · <bdi>{o.customerName}</bdi>
                    </span>
                    <StatusBadge status={o.status} label={t.status[o.status]} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{o.productText}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted-foreground">{o.wilaya}</span>
                    <span className="font-medium tabular-nums">{formatDZD(o.total, locale)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span dir="ltr">{o.phone}</span>
                      <RiskBadge risk={o.risk} labels={t.risk} />
                    </span>
                    <span className="flex items-center gap-2">
                      {o.duplicate && <DuplicateTag label={t.orders.duplicate} hint={t.orders.duplicateHint} />}
                      {formatDateTime(o.createdAt, locale)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.orders.columns.number}</TableHead>
                  <TableHead>{t.orders.columns.date}</TableHead>
                  <TableHead>{t.orders.columns.customer}</TableHead>
                  <TableHead>{t.orders.columns.wilaya}</TableHead>
                  <TableHead>{t.orders.columns.product}</TableHead>
                  <TableHead className="text-end">{t.orders.columns.total}</TableHead>
                  <TableHead>{t.orders.columns.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id} className="relative">
                    <TableCell className="font-medium">
                      <Link href={`/orders/${o.id}`} className="after:absolute after:inset-0 hover:underline">
                        #{o.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(o.createdAt, locale)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customerName}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span dir="ltr">{o.phone}</span>
                        <RiskBadge risk={o.risk} labels={t.risk} />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-40 truncate">{o.wilaya}</TableCell>
                    <TableCell className="max-w-56 truncate">{o.productText}</TableCell>
                    <TableCell className="text-end font-medium tabular-nums">{formatDZD(o.total, locale)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={o.status} label={t.status[o.status]} />
                        {o.duplicate && <DuplicateTag label={t.orders.duplicate} hint={t.orders.duplicateHint} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <nav className="mt-4 flex items-center justify-between gap-2 text-sm">
              <PageLink href={page > 1 ? pageHref(page - 1) : null}>
                <ChevronRight className="size-4 ltr:rotate-180" />
                {t.common.previous}
              </PageLink>
              <span className="text-muted-foreground">{fill(t.common.pageOf, { page, pages })}</span>
              <PageLink href={page < pages ? pageHref(page + 1) : null}>
                {t.common.next}
                <ChevronLeft className="size-4 ltr:rotate-180" />
              </PageLink>
            </nav>
          )}
        </>
      )}
    </>
  );
}

function DuplicateTag({ label, hint }: { label: string; hint: string }) {
  return (
    <span
      title={hint}
      className="inline-flex h-5 items-center gap-1 rounded-full bg-orange-100 px-2 text-xs font-medium text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
    >
      <Copy className="size-3" />
      {label}
    </span>
  );
}

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const cls = buttonVariants({ variant: "outline", size: "sm" });
  if (!href) return <span className={cn(cls, "pointer-events-none opacity-50")}>{children}</span>;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
