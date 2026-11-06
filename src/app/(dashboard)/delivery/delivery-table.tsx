"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Download, FileSpreadsheet, Loader2, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/risk-badge";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { moveDeliveryOrders, saveTracking } from "./actions";

type Tab = "CONFIRMED" | "SHIPPED" | "DELIVERED" | "RETURNED";
type Move = "SHIPPED" | "DELIVERED" | "RETURNED";

export type DeliveryRow = {
  id: string;
  number: number;
  customerName: string;
  phone: string;
  wilaya: string;
  deliveryType: "HOME" | "DESK";
  products: string;
  total: number;
  returnCost: number;
  tracking: string;
  date: string;
  risk: "blacklisted" | "risky" | "ok" | undefined;
};

const MOVES: Record<Tab, Move[]> = {
  CONFIRMED: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["SHIPPED"],
  RETURNED: ["SHIPPED"],
};

export function DeliveryTable({ tab, rows, total }: { tab: Tab; rows: DeliveryRow[]; total: number }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const editableTracking = tab === "CONFIRMED" || tab === "SHIPPED";

  const moveLabel = (m: Move) =>
    tab === "DELIVERED" || tab === "RETURNED"
      ? t.delivery.backToShipped
      : m === "SHIPPED"
        ? t.delivery.markShipped
        : m === "DELIVERED"
          ? t.delivery.markDelivered
          : t.delivery.markReturned;
  const moveIcon = (m: Move) => (tab === "DELIVERED" || tab === "RETURNED" ? Undo2 : m === "SHIPPED" ? Truck : m === "DELIVERED" ? CircleCheck : Undo2);
  const moveStyle = (m: Move) =>
    tab === "DELIVERED" || tab === "RETURNED"
      ? ""
      : m === "RETURNED"
        ? "border-destructive/40 text-destructive hover:bg-destructive/10"
        : m === "DELIVERED"
          ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent"
          : "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent";

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function move(ids: string[], to: Move) {
    startTransition(async () => {
      const res = await moveDeliveryOrders(ids, to).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        toast.error(t.common.error);
        return;
      }
      toast.success(fill(t.delivery.updated, { count: res.count }));
      if (res.skipped > 0) toast.info(fill(t.delivery.skipped, { count: res.skipped }));
      setSelected(new Set());
      router.refresh();
    });
  }

  const exportHref = (format: "xlsx" | "csv") => {
    const p = new URLSearchParams({ status: tab, format });
    if (selected.size > 0) p.set("ids", [...selected].join(","));
    return `/delivery/export?${p}`;
  };

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-14 z-[5] -mx-1 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-background/90 px-1 py-2 backdrop-blur">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
          />
          {selected.size > 0 ? fill(t.delivery.selected, { count: selected.size }) : t.delivery.selectAll}
        </label>
        <span className="text-sm text-muted-foreground">· {fill(t.delivery.count, { count: total })}</span>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          {selected.size > 0 &&
            MOVES[tab].map((m) => {
              const Icon = moveIcon(m);
              return (
                <Button key={m} size="sm" variant="outline" disabled={pending} className={moveStyle(m)} onClick={() => move([...selected], m)}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                  {moveLabel(m)}
                </Button>
              );
            })}
          <a href={exportHref("xlsx")} className={buttonVariants({ size: "sm", variant: "outline" })} title={t.delivery.exportHint} download>
            <FileSpreadsheet className="size-4" />
            {t.delivery.exportExcel}
          </a>
          <a href={exportHref("csv")} className={buttonVariants({ size: "sm", variant: "ghost" })} title={t.delivery.exportHint} download>
            <Download className="size-4" />
            {t.delivery.exportCsv}
          </a>
        </div>
      </div>

      {tab === "RETURNED" && <p className="mb-3 text-xs text-muted-foreground">{t.delivery.returnCostHint}</p>}

      {/* Mobile: cards */}
      <ul className="space-y-2 lg:hidden">
        {rows.map((r) => (
          <li key={r.id} className={cn("rounded-xl border bg-card p-3", selected.has(r.id) && "border-primary bg-primary/5")}>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 size-4 accent-primary" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`#${r.number}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/orders/${r.id}`} className="truncate font-medium">
                    <bdi>#{r.number}</bdi> · <bdi>{r.customerName}</bdi>
                  </Link>
                  <span className="shrink-0 font-medium tabular-nums">{formatDZD(r.total, locale)}</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{r.products}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{r.wilaya}</span>
                  <span>· {t.deliveryType[r.deliveryType]}</span>
                  <span dir="ltr">· {r.phone}</span>
                  <RiskBadge risk={r.risk} labels={t.risk} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <TrackingField id={r.id} value={r.tracking} editable={editableTracking} />
                  {MOVES[tab].map((m) => {
                    const Icon = moveIcon(m);
                    return (
                      <Button
                        key={m}
                        size="icon"
                        variant="outline"
                        disabled={pending}
                        className={cn("size-8 shrink-0", moveStyle(m))}
                        onClick={() => move([r.id], m)}
                        aria-label={moveLabel(m)}
                        title={moveLabel(m)}
                      >
                        <Icon className="size-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{t.orders.columns.number}</TableHead>
              <TableHead>{t.orders.columns.customer}</TableHead>
              <TableHead>{t.orders.columns.wilaya}</TableHead>
              <TableHead className="hidden xl:table-cell">{t.orders.columns.product}</TableHead>
              <TableHead className="text-end">{t.orders.columns.total}</TableHead>
              <TableHead>{t.delivery.tracking}</TableHead>
              {tab === "RETURNED" && <TableHead className="text-end">{t.delivery.returnCost}</TableHead>}
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                <TableCell>
                  <input type="checkbox" className="size-4 accent-primary" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`#${r.number}`} />
                </TableCell>
                <TableCell>
                  <Link href={`/orders/${r.id}`} className="font-medium hover:underline">
                    #{r.number}
                  </Link>
                  <div className="text-xs text-muted-foreground tabular-nums">{r.date}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{r.customerName}</span>
                    <RiskBadge risk={r.risk} labels={t.risk} />
                  </div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    <span className="rtl:float-right">{r.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-36 truncate">{r.wilaya}</div>
                  <div className="text-xs text-muted-foreground">{t.deliveryType[r.deliveryType]}</div>
                </TableCell>
                <TableCell className="hidden max-w-48 truncate xl:table-cell">{r.products}</TableCell>
                <TableCell className="text-end font-medium tabular-nums">{formatDZD(r.total, locale)}</TableCell>
                <TableCell>
                  <TrackingField id={r.id} value={r.tracking} editable={editableTracking} />
                </TableCell>
                {tab === "RETURNED" && <TableCell className="text-end text-red-600 tabular-nums dark:text-red-400">{formatDZD(r.returnCost, locale)}</TableCell>}
                <TableCell>
                  <div className="flex gap-1">
                    {MOVES[tab].map((m) => {
                      const Icon = moveIcon(m);
                      return (
                        <Button
                          key={m}
                          size="icon"
                          variant="outline"
                          disabled={pending}
                          className={cn("size-8", moveStyle(m))}
                          onClick={() => move([r.id], m)}
                          aria-label={moveLabel(m)}
                          title={moveLabel(m)}
                        >
                          <Icon className="size-4" />
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** Saves on blur or Enter, only when the value changed. */
function TrackingField({ id, value, editable }: { id: string; value: string; editable: boolean }) {
  const { t } = useI18n();
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(value);
  const [pending, startTransition] = useTransition();

  if (!editable) return <span className="text-sm" dir="ltr">{value || "—"}</span>;

  function save() {
    const next = text.trim();
    if (next === saved) return;
    startTransition(async () => {
      const res = await saveTracking(id, next).catch(() => ({ ok: false }));
      if (res.ok) {
        setSaved(next);
        toast.success(t.delivery.trackingSaved);
      } else {
        setText(saved);
        toast.error(t.common.error);
      }
    });
  }

  return (
    <div className="relative min-w-0 flex-1 lg:w-40 lg:flex-none">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        placeholder={t.delivery.trackingPlaceholder}
        aria-label={t.delivery.tracking}
        maxLength={60}
        dir="ltr"
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 rtl:text-right"
      />
      {pending && <Loader2 className="absolute top-1/2 end-2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </div>
  );
}
