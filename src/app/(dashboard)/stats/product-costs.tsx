import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Dictionary } from "@/i18n/ar";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import type { ProductRow } from "@/lib/product-report";
import { cn } from "@/lib/utils";

/** Per product: ad cost per delivered order next to the margin it brings, and what is left. */
export function ProductCosts({ rows, generalAds, t, locale }: { rows: ProductRow[]; generalAds: number; t: Dictionary; locale: Locale }) {
  const p = t.productReport;
  const money = (n: number | null) => (n === null ? "—" : formatDZD(n, locale));
  const anyAds = rows.some((r) => r.ads > 0);

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-border">
      <h2 className="text-base font-semibold">{p.title}</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">{p.description}</p>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">{t.stats.noData}</p>
      ) : (
        <>
          {!anyAds && <p className="mb-3 rounded-md bg-muted px-3 py-2 text-sm">{p.noProductAds}</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{p.product}</TableHead>
                  <TableHead className="text-end">{p.delivered}</TableHead>
                  <TableHead className="text-end">{p.ads}</TableHead>
                  <TableHead className="text-end">{p.adsPerDelivered}</TableHead>
                  <TableHead className="text-end">{p.marginPerDelivered}</TableHead>
                  <TableHead className="text-end">{p.profit}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  // Losing money on each parcel: the ads cost more than the product earns.
                  const losing = r.adsPerDelivered !== null && r.marginPerDelivered !== null && r.adsPerDelivered > r.marginPerDelivered;
                  return (
                    <TableRow key={r.productId}>
                      <TableCell className="max-w-48 truncate font-medium">
                        {r.name}
                        <div className="text-xs font-normal text-muted-foreground">
                          {fill(p.ordersLine, { orders: r.orders, returned: r.returned })}
                        </div>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{r.delivered}</TableCell>
                      <TableCell className="text-end tabular-nums">{money(r.ads)}</TableCell>
                      <TableCell className={cn("text-end tabular-nums", losing && "font-semibold text-negative")}>
                        {r.ads > 0 && r.delivered === 0 ? p.noDelivered : money(r.adsPerDelivered)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{money(r.marginPerDelivered)}</TableCell>
                      <TableCell className={cn("text-end font-medium tabular-nums", r.profit < 0 && "text-negative")}>{money(r.profit)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {generalAds > 0 && <p className="mt-3 text-xs text-muted-foreground">{fill(p.generalNote, { amount: money(generalAds) })}</p>}
        </>
      )}
    </section>
  );
}
