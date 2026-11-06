import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { RiskBadge } from "@/components/risk-badge";
import { db } from "@/lib/db";
import { RISK_CANCELS, RISK_RETURNS, riskOf, statsFor } from "@/lib/customers";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 25;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.customers.title };
}

function str(v: string | string[] | undefined) {
  return typeof v === "string" ? v.trim() : "";
}

/** Customer ids with enough returns or cancellations to be "risky". */
async function riskyIds() {
  const [returned, cancelled] = await Promise.all([
    db.order.groupBy({
      by: ["customerId"],
      where: { status: "RETURNED" },
      _count: { _all: true },
      having: { customerId: { _count: { gte: RISK_RETURNS } } },
    }),
    db.order.groupBy({
      by: ["customerId"],
      where: { status: "CANCELLED" },
      _count: { _all: true },
      having: { customerId: { _count: { gte: RISK_CANCELS } } },
    }),
  ]);
  return [...new Set([...returned, ...cancelled].map((g) => g.customerId))];
}

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const sp = await searchParams;
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const q = str(sp.q);
  const filter = str(sp.filter);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const and: Prisma.CustomerWhereInput[] = [];
  if (q) {
    const digits = q.replace(/[\s\-+]/g, "").replace(/^213/, "0");
    and.push({
      OR: [{ name: { contains: q, mode: "insensitive" } }, ...(/^\d+$/.test(digits) ? [{ phone: { contains: digits } }] : [])],
    });
  }
  if (filter === "blacklisted") and.push({ blacklisted: true });
  if (filter === "risky") and.push({ OR: [{ blacklisted: true }, { id: { in: await riskyIds() } }] });
  const where: Prisma.CustomerWhereInput = { AND: and };

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { orders: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
    }),
    db.customer.count({ where }),
  ]);
  const stats = await statsFor(customers.map((c) => c.id));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = customers.map((c) => {
    const s = stats.get(c.id) ?? { total: 0, delivered: 0, returned: 0, cancelled: 0 };
    return { ...c, stats: s, risk: riskOf(c.blacklisted, s), lastOrder: c.orders[0]?.createdAt };
  });

  const href = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (filter) next.set("filter", filter);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    return s ? `/customers?${s}` : "/customers";
  };

  const tabs = [
    { key: "", label: t.customers.filterAll },
    { key: "risky", label: t.customers.filterRisky },
    { key: "blacklisted", label: t.customers.filterBlacklisted },
  ];

  return (
    <>
      <PageIntro description={t.pages.customers.description} />

      <div className="mb-4 space-y-3">
        <form action="/customers" className="relative">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" type="search" defaultValue={q} placeholder={t.customers.searchPlaceholder} className="h-10 ps-9" aria-label={t.common.search} />
        </form>
        <nav className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={href({ filter: tab.key, page: "" })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === tab.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.customers.emptyTitle}
          description={q || filter ? t.customers.emptyFiltered : t.customers.emptyText}
        />
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">{fill(t.customers.count, { count: total })}</p>

          <ul className="space-y-2 md:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/customers/${c.id}`} className="block rounded-xl border bg-card p-3 active:bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{c.name}</span>
                    <RiskBadge risk={c.risk} labels={t.risk} />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span dir="ltr">{c.phone}</span>
                    <span className="tabular-nums">
                      {c.stats.total} · ✓{c.stats.delivered} · ↩{c.stats.returned} · ✕{c.stats.cancelled}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.customers.columns.customer}</TableHead>
                  <TableHead className="text-center">{t.customers.columns.orders}</TableHead>
                  <TableHead className="text-center">{t.customers.columns.delivered}</TableHead>
                  <TableHead className="text-center">{t.customers.columns.returned}</TableHead>
                  <TableHead className="text-center">{t.customers.columns.cancelled}</TableHead>
                  <TableHead>{t.customers.columns.lastOrder}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id} className="relative">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/customers/${c.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                          {c.name}
                        </Link>
                        <RiskBadge risk={c.risk} labels={t.risk} />
                      </div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        <span className="rtl:float-right">{c.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{c.stats.total}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.stats.delivered}</TableCell>
                    <TableCell className={cn("text-center tabular-nums", c.stats.returned > 0 && "font-semibold text-red-600 dark:text-red-400")}>
                      {c.stats.returned}
                    </TableCell>
                    <TableCell className={cn("text-center tabular-nums", c.stats.cancelled > 0 && "text-amber-700 dark:text-amber-400")}>
                      {c.stats.cancelled}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{c.lastOrder ? formatDate(c.lastOrder, locale) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <nav className="mt-4 flex items-center justify-between gap-2 text-sm">
              <PageLink href={page > 1 ? href({ page: String(page - 1) }) : null}>
                <ChevronRight className="size-4 ltr:rotate-180" />
                {t.common.previous}
              </PageLink>
              <span className="text-muted-foreground">{fill(t.common.pageOf, { page, pages })}</span>
              <PageLink href={page < pages ? href({ page: String(page + 1) }) : null}>
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

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const cls = buttonVariants({ variant: "outline", size: "sm" });
  if (!href) return <span className={cn(cls, "pointer-events-none opacity-50")}>{children}</span>;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
