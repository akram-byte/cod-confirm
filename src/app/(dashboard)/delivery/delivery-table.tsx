"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Download, FileSpreadsheet, Loader2, MapPin, Printer, RefreshCw, Send, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/risk-badge";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { chooseDesk, loadDesks, moveDeliveryOrders, refreshCourierStatuses, saveTracking, sendOrdersToCourier } from "./actions";

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
  wilayaCode: number;
  viaCourier: boolean;
  courierStatus: string;
  labelUrl: string;
  stopDeskName: string;
  date: string;
  risk: "blacklisted" | "risky" | "ok" | undefined;
};

const MOVES: Record<Tab, Move[]> = {
  CONFIRMED: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["SHIPPED"],
  RETURNED: ["SHIPPED"],
};

export type CourierInfo = { label: string; syncedAgo: string | null } | null;

export function DeliveryTable({ tab, rows, total, courier }: { tab: Tab; rows: DeliveryRow[]; total: number; courier: CourierInfo }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  // Rows fold away the moment an action is chosen; they come back only if the server refuses.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const editableTracking = tab === "CONFIRMED" || tab === "SHIPPED";
  const pickDesk = !!courier && tab === "CONFIRMED";

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
        ? "text-negative hover:bg-[var(--pill-negative-bg)]"
        : "border-hue-track bg-hue-soft text-hue-ink hover:bg-hue-track hover:text-hue-ink";

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function move(ids: string[], to: Move) {
    setLeaving((l) => new Set([...l, ...ids]));
    startTransition(async () => {
      const res = await moveDeliveryOrders(ids, to).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        setLeaving((l) => new Set([...l].filter((id) => !ids.includes(id))));
        toast.error(t.common.error);
        return;
      }
      toast.success(fill(t.delivery.updated, { count: res.count }));
      if (res.skipped > 0) toast.info(fill(t.delivery.skipped, { count: res.skipped }));
      setSelected(new Set());
      router.refresh();
    });
  }

  function sendToCourier() {
    const ids = [...selected];
    startTransition(async () => {
      const res = await sendOrdersToCourier(ids).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        toast.error(t.common.error);
        return;
      }
      if (res.sent > 0) toast.success(fill(t.courier.sent, { count: res.sent, courier: courier!.label }));
      if (res.failed.length > 0) {
        toast.warning(fill(t.courier.notSent, { count: res.failed.length }), {
          description: res.failed
            .slice(0, 6)
            .map((f) => `#${f.number}: ${f.reason === "courier" ? f.message : t.courier.reasons[f.reason]}`)
            .join(" · "),
          duration: 15_000,
        });
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  function refreshStatuses() {
    startTransition(async () => {
      const res = await refreshCourierStatuses().catch(() => ({ ok: false as const }));
      if (!res.ok) {
        toast.error(t.common.error);
        return;
      }
      toast.success(fill(t.courier.refreshed, { delivered: res.delivered, returned: res.returned }));
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
      <div className="sticky top-12 z-[5] md:top-0 -mx-1 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-background px-1 py-2">
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
          {courier && tab === "SHIPPED" && (
            <>
              {courier.syncedAgo && (
                <span className="text-xs text-muted-foreground">{fill(t.courier.syncedAgo, { time: courier.syncedAgo })}</span>
              )}
              <Button size="sm" variant="outline" disabled={pending} onClick={refreshStatuses}>
                <RefreshCw className={cn("size-4", pending && "animate-spin")} />
                {t.courier.refresh}
              </Button>
            </>
          )}
          {courier && tab === "CONFIRMED" && selected.size > 0 && (
            <Button size="sm" disabled={pending} onClick={sendToCourier}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {fill(t.courier.send, { courier: courier.label })}
            </Button>
          )}
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
          <li key={r.id} className={cn("rounded-xl border bg-card p-3", selected.has(r.id) && "border-primary bg-primary/5", leaving.has(r.id) && "row-out")}>
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
                {pickDesk && r.deliveryType === "DESK" && (
                  <div className="mt-2">
                    <DeskPicker id={r.id} wilayaCode={r.wilayaCode} current={r.stopDeskName} />
                  </div>
                )}
                <CourierLine row={r} />
                <div className="mt-2 flex items-center gap-2">
                  <TrackingField id={r.id} value={r.tracking} editable={editableTracking && !r.viaCourier} />
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
              <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined} className={cn(leaving.has(r.id) && "row-out")}>
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
                  {pickDesk && r.deliveryType === "DESK" && (
                    <div className="mt-1">
                      <DeskPicker id={r.id} wilayaCode={r.wilayaCode} current={r.stopDeskName} />
                    </div>
                  )}
                  {!pickDesk && r.stopDeskName && <div className="max-w-36 truncate text-xs text-muted-foreground">{r.stopDeskName}</div>}
                </TableCell>
                <TableCell className="hidden max-w-48 truncate xl:table-cell">{r.products}</TableCell>
                <TableCell className="text-end font-medium tabular-nums">{formatDZD(r.total, locale)}</TableCell>
                <TableCell>
                  <TrackingField id={r.id} value={r.tracking} editable={editableTracking && !r.viaCourier} />
                  <CourierLine row={r} />
                </TableCell>
                {tab === "RETURNED" && <TableCell className="text-end text-negative tabular-nums">{formatDZD(r.returnCost, locale)}</TableCell>}
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

/** Courier status text and label link, for parcels created through the courier. */
function CourierLine({ row }: { row: DeliveryRow }) {
  const { t } = useI18n();
  if (!row.viaCourier) return null;
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Truck className="size-3.5" />
        {row.courierStatus || t.courier.waitingStatus}
      </span>
      {row.labelUrl && (
        <a href={row.labelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
          <Printer className="size-3.5" />
          {t.courier.label}
        </a>
      )}
    </div>
  );
}

/** Courier office for a stop-desk order: the list loads from the courier on first click. */
function DeskPicker({ id, wilayaCode, current }: { id: string; wilayaCode: number; current: string }) {
  const { t } = useI18n();
  const [desks, setDesks] = useState<{ id: number; name: string; address: string }[] | null>(null);
  const [name, setName] = useState(current);
  const [pending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      const res = await loadDesks(wilayaCode).catch(() => ({ ok: false as const, desks: [] }));
      if (!res.ok) toast.error(t.common.error);
      else if (res.desks.length === 0) toast.error(t.courier.noDesks);
      else setDesks(res.desks);
    });
  }

  function pick(deskId: number) {
    const desk = desks?.find((d) => d.id === deskId);
    if (!desk) return;
    startTransition(async () => {
      const res = await chooseDesk(id, deskId).catch(() => ({ ok: false }));
      if (!res.ok) {
        toast.error(t.common.error);
        return;
      }
      setName(desk.name);
      setDesks(null);
      toast.success(t.courier.deskSaved);
    });
  }

  if (desks) {
    return (
      <select
        autoFocus
        defaultValue=""
        disabled={pending}
        onChange={(e) => pick(Number(e.target.value))}
        aria-label={t.courier.desk}
        className="h-8 w-full max-w-56 rounded-lg border border-input bg-card px-2 text-sm"
      >
        <option value="" disabled>
          {t.courier.chooseDesk}
        </option>
        {desks.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} — {d.address}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      className={cn(
        "inline-flex max-w-56 items-center gap-1 truncate rounded-md text-xs hover:underline",
        name ? "text-muted-foreground" : "font-medium text-amber-700 dark:text-amber-400",
      )}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
      {name || t.courier.chooseDesk}
    </button>
  );
}
