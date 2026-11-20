"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatPercent } from "@/lib/format";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { setDeskOnly } from "./actions";

export type WilayaReturnRow = {
  wilayaCode: number;
  label: string;
  delivered: number;
  returned: number;
  returnRate: number | null;
  homeRate: number | null;
  deskRate: number | null;
  loss: number;
  net: number;
  deskOnly: boolean;
  hasFee: boolean;
  suggest: boolean;
  bad: boolean;
};

const SHOWN = 10;

export function WilayaReturns({ rows }: { rows: WilayaReturnRow[] }) {
  const { t, locale } = useI18n();
  const w = t.wilayaReport;
  const router = useRouter();
  const [all, setAll] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<number | null>(null);
  const pct = (n: number | null) => formatPercent(n, locale);
  const money = (n: number) => formatDZD(n, locale);
  const shown = all ? rows : rows.slice(0, SHOWN);
  const suggested = rows.filter((r) => r.suggest).length;

  function toggle(r: WilayaReturnRow, value: boolean) {
    setBusy(r.wilayaCode);
    startTransition(async () => {
      const res = await setDeskOnly(r.wilayaCode, value).catch(() => ({ ok: false as const }));
      setBusy(null);
      if (!res.ok) {
        toast.error(t.common.error);
        return;
      }
      toast.success(fill(value ? w.deskOnlyOn : w.deskOnlyOff, { wilaya: r.label }));
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-border">
      <div className="mb-3">
        <h2 className="text-base font-semibold">{w.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">{w.empty}</p>
      ) : (
        <>
          {suggested > 0 && (
            <p className="mb-3 rounded-md bg-negative/10 px-3 py-2 text-sm text-negative">
              {fill(w.suggestBanner, { count: suggested })}
            </p>
          )}
          {/* Phone: cards, so the switch is always in reach. */}
          <ul className="divide-y md:hidden">
            {shown.map((r) => (
              <li key={r.wilayaCode} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.label}
                    {r.suggest && (
                      <span className="ms-2 rounded bg-negative/10 px-1.5 py-0.5 text-xs font-normal text-negative">
                        {w.suggest}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {w.parcels}: {r.delivered} / <span className={cn(r.returned > 0 && "text-negative")}>{r.returned}</span> ·{" "}
                    <span className={cn("font-medium", r.bad ? "text-negative" : "text-foreground")}>{pct(r.returnRate)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {w.homeDesk}: {pct(r.homeRate)} · {pct(r.deskRate)}
                  </p>
                  <p className="text-xs tabular-nums">
                    <span className="text-muted-foreground">{w.loss}: </span>
                    {r.loss > 0 ? <span className="text-negative">− {money(r.loss)}</span> : money(0)}
                    <span className="text-muted-foreground"> · {w.net}: </span>
                    <span className={cn(r.net < 0 && "text-negative")}>{money(r.net)}</span>
                  </p>
                </div>
                {r.hasFee && (
                  <label className="flex shrink-0 flex-col items-center gap-1 text-[11px] text-muted-foreground">
                    <Switch
                      checked={r.deskOnly}
                      disabled={pending && busy === r.wilayaCode}
                      onCheckedChange={(v) => toggle(r, v)}
                      aria-label={`${r.label} ${w.deskOnly}`}
                    />
                    {w.deskOnly}
                  </label>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{w.wilaya}</TableHead>
                  <TableHead className="text-end">{w.parcels}</TableHead>
                  <TableHead className="text-end">{w.returnRate}</TableHead>
                  <TableHead className="text-end">{w.homeDesk}</TableHead>
                  <TableHead className="text-end">{w.loss}</TableHead>
                  <TableHead className="text-end">{w.net}</TableHead>
                  <TableHead className="text-center">{w.deskOnly}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((r) => (
                  <TableRow key={r.wilayaCode}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {r.label}
                      {r.suggest && (
                        <span className="ms-2 rounded bg-negative/10 px-1.5 py-0.5 text-xs font-normal text-negative">
                          {w.suggest}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-end tabular-nums whitespace-nowrap">
                      {r.delivered} <span className="text-muted-foreground">/</span>{" "}
                      <span className={cn(r.returned > 0 && "text-negative")}>{r.returned}</span>
                    </TableCell>
                    <TableCell className={cn("text-end font-medium tabular-nums", r.bad && "text-negative")}>
                      {pct(r.returnRate)}
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground tabular-nums whitespace-nowrap">
                      {pct(r.homeRate)} · {pct(r.deskRate)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums whitespace-nowrap">
                      {r.loss > 0 ? <span className="text-negative">− {money(r.loss)}</span> : money(0)}
                    </TableCell>
                    <TableCell className={cn("text-end tabular-nums whitespace-nowrap", r.net < 0 && "text-negative")}>
                      {money(r.net)}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.hasFee ? (
                        <Switch
                          checked={r.deskOnly}
                          disabled={pending && busy === r.wilayaCode}
                          onCheckedChange={(v) => toggle(r, v)}
                          aria-label={`${r.label} ${w.deskOnly}`}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > SHOWN && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll((v) => !v)}>
              {all ? w.showLess : fill(w.showAll, { count: rows.length })}
            </Button>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{w.hint}</p>
        </>
      )}
    </section>
  );
}
