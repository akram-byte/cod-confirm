import {
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Menu,
  MessageCircle,
  Phone,
  PhoneMissed,
  Printer,
  RefreshCw,
  Send,
  Truck,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge, PILL } from "@/components/status-badge";
import { RiskBadge } from "@/components/risk-badge";
import { BrandMark, Wordmark } from "@/components/brand-mark";
import { getWilaya, wilayaLabel } from "@/lib/algeria";
import { formatDZD } from "@/lib/money";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/ar";
import type { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/*
 * Pieces of the real app, rebuilt with its own components and sample data that adds up.
 * Shared sample: Montre Classic sells at 3 900 DA and costs 1 450 DA; home delivery
 * Sétif 600, Alger 400, Oran 700, Annaba 800, Béjaïa 600, Djelfa 700, Tizi Ouzou desk 450.
 */

export type FragProps = { t: Dictionary; locale: Locale };

export const PRICE = 3900;
export const COST = 1450;

const wil = (code: number, locale: Locale) => {
  const w = getWilaya(code);
  return w ? wilayaLabel(w, locale) : String(code);
};

/** The app's screens are shown, not used: one accessible caption, the insides hidden from readers. */
export function Frag({ caption, className, children }: { caption: string; className?: string; children: React.ReactNode }) {
  return (
    <figure data-ui className={cn("min-w-0", className)}>
      <figcaption className="sr-only">{caption}</figcaption>
      <div aria-hidden className="select-none">
        {children}
      </div>
    </figure>
  );
}

const Tel = ({ n }: { n: string }) => (
  <bdi dir="ltr" className="tabular-nums">
    {n}
  </bdi>
);

/* ---------- Confirmation ---------- */

const OUTCOMES = [
  { key: "CONFIRMED", Icon: Check, style: "bg-primary text-primary-foreground" },
  { key: "NO_ANSWER", Icon: PhoneMissed, style: "border border-input bg-card text-foreground" },
  { key: "CALLBACK", Icon: CalendarClock, style: "border border-input bg-card text-foreground" },
  { key: "CANCELLED", Icon: X, style: "border border-input bg-card text-negative" },
] as const;

function OutcomeButtons({ t, compact, active }: { t: Dictionary; compact?: boolean; active?: "CONFIRMED" }) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
      {OUTCOMES.map(({ key, Icon, style }) => (
        <span
          key={key}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium",
            style,
            active === key && "ring-3 ring-ring/40",
          )}
        >
          <Icon className="size-4" />
          {t.confirm.outcomes[key]}
        </span>
      ))}
    </div>
  );
}

/** Hero: the call card of the Confirmation screen for order #1284. */
export function CallCard({ t, locale }: FragProps) {
  const L = t.landing;
  const s = L.sample;
  const money = (n: number) => formatDZD(n, locale);
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">
              <bdi>#1284</bdi> · <bdi>{s.names.yacine}</bdi>
            </p>
            <StatusBadge status="NO_ANSWER" label={t.status.NO_ANSWER} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {L.ui.today} 10:42 · {t.confirm.attempts}: <span className="tabular-nums">1</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ExternalLink className="size-4" />
          {t.confirm.open}
        </span>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(buttonVariants({ size: "lg" }), "h-11 text-base")} dir="ltr">
            <Phone className="size-4" />
            0661 23 45 78
          </span>
          <span className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 text-base")}>
            <MessageCircle className="size-4" />
            {t.confirm.whatsapp}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="font-medium">{wil(19, locale)}</p>
            <p>{s.communes.eulma}</p>
            <p className="text-muted-foreground">{t.deliveryType.HOME}</p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                {s.product} <span className="text-muted-foreground tabular-nums">×1</span>
              </span>
              <span className="shrink-0 tabular-nums">{money(PRICE)}</span>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>{t.orderFields.deliveryFee}</span>
              <span className="tabular-nums">{money(600)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t pt-1 text-base font-semibold">
              <span>{t.orderFields.total}</span>
              <span className="tabular-nums">{money(4500)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="text-xs text-muted-foreground">
            {t.status.NO_ANSWER} · {L.ui.today} 10:58
          </p>
          <p className="mt-0.5">{s.callNote}</p>
        </div>
        <div className="flex min-h-14 items-start rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground">
          {t.confirm.notePlaceholder}
        </div>
        <OutcomeButtons t={t} compact />
      </div>
    </div>
  );
}

type QueueItem = { n: number; name: string; w: number; status: OrderStatus; attempts: number; time: string; risk?: "risky" | "blacklisted" };

export function queueItems(t: Dictionary): QueueItem[] {
  const n = t.landing.sample.names;
  return [
    { n: 1279, name: n.nadia, w: 9, status: "CALLBACK", attempts: 2, time: "14:00" },
    { n: 1284, name: n.yacine, w: 19, status: "NO_ANSWER", attempts: 1, time: "10:42" },
    { n: 1286, name: n.meriem, w: 16, status: "NEW", attempts: 0, time: "11:05" },
    { n: 1287, name: n.karim, w: 31, status: "NEW", attempts: 0, time: "11:18", risk: "risky" },
    { n: 1289, name: n.sofiane, w: 25, status: "NEW", attempts: 0, time: "11:40" },
  ];
}

function QueueList({ t, locale, current = 1284, className }: FragProps & { current?: number; className?: string }) {
  return (
    <ul className={cn("divide-y rounded-xl border bg-card text-sm", className)}>
      {queueItems(t).map((o) => (
        <li key={o.n} className={cn("p-3", o.n === current && "bg-primary/5 ring-1 ring-inset ring-primary/30")}>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-medium">
              <bdi>#{o.n}</bdi> · <bdi>{o.name}</bdi>
            </span>
            <StatusBadge status={o.status} label={t.status[o.status]} className="h-5 px-2" />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{wil(o.w, locale)}</span>
              <RiskBadge risk={o.risk} labels={t.risk} />
            </span>
            <span className="shrink-0 tabular-nums">
              {o.attempts > 0 && `${o.attempts}× · `}
              {o.time}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Confirm faster: the queue beside the current order's call history and WhatsApp message. */
export function QueueScreen({ t, locale }: FragProps) {
  const L = t.landing;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium text-muted-foreground">{t.confirm.queueTitle}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{fill(L.ui.queueRemaining, { count: 5 })}</span>
        </div>
        <QueueList t={t} locale={locale} />
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">{t.confirm.previousCalls}</p>
          <ol className="mt-3 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className={cn("mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full", PILL.warning)}>
                <PhoneMissed className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p>
                  {t.status.NO_ANSWER} · <span className="text-muted-foreground tabular-nums">{L.ui.today} 10:58</span>
                </p>
                <p className="text-muted-foreground">{L.sample.callNote}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className={cn("mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full", PILL.info)}>
                <MessageCircle className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p>
                  {t.confirm.whatsapp} · <span className="text-muted-foreground tabular-nums">{L.ui.today} 11:01</span>
                </p>
                <p className="mt-1.5 rounded-lg rounded-ss-sm bg-hue-soft p-3 text-hue-ink">{L.sample.whatsapp}</p>
              </div>
            </li>
          </ol>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              <bdi>#1284</bdi> · <bdi>{L.sample.names.yacine}</bdi>
            </p>
            <span className="text-xs text-muted-foreground">
              {t.confirm.attempts}: <span className="tabular-nums">1</span>
            </span>
          </div>
          <OutcomeButtons t={t} compact />
        </div>
      </div>
    </div>
  );
}

/* ---------- Risk ---------- */

/** Stop bad orders: the Customers list with its history and badges. */
export function CustomersScreen({ t, locale }: FragProps) {
  const L = t.landing;
  const n = L.sample.names;
  const rows = [
    { name: n.rachid, phone: "0550 12 34 87", w: 31, orders: 4, delivered: 1, returned: 3, risk: "blacklisted" as const },
    { name: n.samir, phone: "0770 98 11 02", w: 17, orders: 4, delivered: 0, returned: 2, risk: "risky" as const },
    { name: n.yacine, phone: "0661 23 45 78", w: 19, orders: 2, delivered: 2, returned: 0, risk: undefined },
    { name: n.lina, phone: "0699 45 21 30", w: 16, orders: 5, delivered: 5, returned: 0, risk: undefined },
  ];
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-start text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-start font-medium">{L.ui.customers}</th>
            <th className="hidden px-3 py-2.5 text-start font-medium sm:table-cell">{t.orderFields.wilaya}</th>
            <th className="px-3 py-2.5 text-end font-medium">{L.ui.ordersCount}</th>
            <th className="px-3 py-2.5 text-end font-medium">{L.ui.deliveredCount}</th>
            <th className="px-4 py-2.5 text-end font-medium">{L.ui.returnedCount}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.phone}>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{r.name}</span>
                  <RiskBadge risk={r.risk} labels={t.risk} />
                </div>
                <p className="text-xs text-muted-foreground">
                  <Tel n={r.phone} />
                </p>
              </td>
              <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">{wil(r.w, locale)}</td>
              <td className="px-3 py-3 text-end tabular-nums">{r.orders}</td>
              <td className="px-3 py-3 text-end tabular-nums">{r.delivered}</td>
              <td className={cn("px-4 py-3 text-end tabular-nums", r.returned > 0 && "font-semibold text-negative")}>{r.returned}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A new order caught twice: same number, same product within 24 h, and a risky customer. */
export function FlaggedOrders({ t, locale }: FragProps) {
  const L = t.landing;
  const n = L.sample.names;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">
            <bdi>#1291</bdi> · <bdi>{n.samir}</bdi>
          </p>
          <StatusBadge status="NEW" label={t.status.NEW} />
          <RiskBadge risk="risky" labels={t.risk} className="h-6 px-2.5" />
          <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium", PILL.warning)}>
            <Copy className="size-3" />
            {t.orders.duplicate}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {wil(17, locale)} · {L.sample.product} · {formatDZD(4600, locale)}
        </p>
        <p className={cn("mt-3 rounded-lg p-3 text-sm", PILL.warning)}>{fill(L.ui.duplicateOf, { number: "#1290" })}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">
            <bdi>#1293</bdi> · <bdi>{n.rachid}</bdi>
          </p>
          <StatusBadge status="NEW" label={t.status.NEW} />
          <RiskBadge risk="blacklisted" labels={t.risk} className="h-6 px-2.5" />
        </div>
        <p className={cn("mt-3 rounded-lg p-3 text-sm", PILL.negative)}>{fill(L.ui.blacklistedOf, { date: "02/09/2026" })}</p>
      </div>
    </div>
  );
}

/* ---------- Delivery ---------- */

/** Ship in one click: the Delivery page with three confirmed orders selected. */
export function DeliveryScreen({ t, locale }: FragProps) {
  const L = t.landing;
  const n = L.sample.names;
  const money = (v: number) => formatDZD(v, locale);
  const rows: { no: number; name: string; w: number; status: OrderStatus; tracking?: string; total: number; on?: boolean }[] = [
    { no: 1270, name: n.lina, w: 16, status: "CONFIRMED", total: 4300, on: true },
    { no: 1271, name: n.mohamed, w: 15, status: "CONFIRMED", total: 4350, on: true },
    { no: 1274, name: n.yasmine, w: 6, status: "CONFIRMED", total: 4500, on: true },
    { no: 1262, name: n.walid, w: 31, status: "SHIPPED", tracking: "yal-7K2M4P", total: 4600 },
    { no: 1258, name: n.amel, w: 23, status: "DELIVERED", tracking: "yal-3R8T1C", total: 4700 },
    { no: 1255, name: n.samir, w: 17, status: "RETURNED", tracking: "yal-9D4W6B", total: 4600 },
  ];
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-hue-soft/60 px-4 py-3">
        <span className="text-sm font-medium tabular-nums">{fill(t.delivery.selected, { count: 3 })}</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}>
            <Printer />
            {t.courier.label}
          </span>
          <span className={buttonVariants({ size: "sm" })}>
            <Send />
            {fill(t.courier.send, { courier: "Yalidine" })}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.no} className={cn(r.on && "bg-primary/5")}>
                <td className="w-10 ps-4 py-3">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-[4px] border",
                      r.on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {r.on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="font-medium">
                    <bdi>#{r.no}</bdi> · <bdi>{r.name}</bdi>
                  </span>
                  <p className="text-xs text-muted-foreground">{wil(r.w, locale)}</p>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={r.status} label={t.status[r.status]} />
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {r.tracking ? (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-3.5" />
                      <bdi dir="ltr">{r.tracking}</bdi>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="pe-4 py-3 text-end font-medium tabular-nums">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
        <span>{fill(t.courier.syncedAgo, { time: fill(L.ui.minutes, { count: 6 }) })}</span>
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="size-3.5" />
          {t.courier.refresh}
        </span>
      </div>
    </div>
  );
}

/* ---------- Telegram ---------- */

/** The real alert text (src/lib/telegram.ts), shown as a chat message. */
export function TelegramAlert({ t, locale, className }: FragProps & { className?: string }) {
  const L = t.landing;
  const tg = t.telegram;
  return (
    <div className={cn("rounded-xl border bg-card p-3 text-sm", className)}>
      <div className="flex items-center gap-2">
        <BrandMark className="size-7 rounded-full" />
        <span className="font-semibold">{L.ui.bot}</span>
        <span className="ms-auto text-xs text-muted-foreground">{L.ui.now}</span>
      </div>
      <div className="mt-2 space-y-0.5 leading-relaxed">
        <p className="font-semibold">{fill(tg.newOrder, { number: 1292 })}</p>
        <p className="pt-1.5">👤 {L.sample.names.meriem}</p>
        <p>
          📞 <Tel n="0552 64 18 09" />
        </p>
        <p>📦 {L.sample.product}</p>
        <p>
          📍 {wil(16, locale)} · {L.sample.communes.babEzzouar} · {tg.home}
        </p>
        <p className="font-semibold">💰 {formatDZD(4300, locale)}</p>
      </div>
      <p className="mt-2.5 rounded-md bg-muted py-2 text-center text-xs font-medium">{tg.open}</p>
    </div>
  );
}

/* ---------- Profit ---------- */

/** One month of the sample shop. Every line is used by the ledger, the KPIs and the chart. */
export const MONTH = {
  orders: 412,
  waiting: 30,
  confirmed: 318,
  cancelled: 64,
  delivered: 241,
  returned: 39,
  sales: 241 * 4500,
  productCost: 241 * COST,
  deliveryFees: 241 * 600,
  returnCosts: 39 * 450,
  adSpend: 186000,
};
export const PROFIT = MONTH.sales - MONTH.productCost - MONTH.deliveryFees - MONTH.returnCosts - MONTH.adSpend;

/** 30 days of profit that sum to the month's profit (the last day takes the remainder). */
export function profitDays() {
  const shape = [
    9800, 14200, 11600, -3200, 12900, 16400, 15100, 12700, 13300, 17800, 14600, 10200, -1800, 12100, 15900, 18300,
    13700, 13400, 14800, 16900, 12600, 11300, 15200, 17400, 13900, 10600, 14100, 16700, 12800,
  ];
  const last = PROFIT - shape.reduce((a, b) => a + b, 0);
  const start = Date.UTC(2026, 9, 13);
  return [...shape, last].map((profit, i) => ({
    day: new Date(start + i * 86400000).toISOString().slice(0, 10),
    orders: 0,
    confirmed: 0,
    delivered: 0,
    profit,
  }));
}

/* ---------- Journey steps ---------- */

export function AdLinkCard({ t, locale }: FragProps) {
  const L = t.landing;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{L.sample.product}</p>
          <p className="text-sm text-muted-foreground tabular-nums">{formatDZD(PRICE, locale)}</p>
        </div>
        <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", PILL.soft)}>
          {t.products.active}
        </span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{t.products.orderLink}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-input bg-muted/40 px-2.5 text-sm" dir="ltr">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">…/order/{L.sample.slug}</span>
        </span>
        <span className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Copy />
          {t.products.copyLink}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Meta Pixel", "TikTok Pixel"].map((p) => (
          <span key={p} className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium", PILL.soft)}>
            <Check className="size-3" strokeWidth={3} />
            <span dir="ltr">{p}</span> · {L.ui.pixelsOn}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium">{label}</p>
      <p className="flex h-10 items-center rounded-lg border border-input px-3 text-sm">
        {ltr ? <Tel n={value} /> : value}
      </p>
    </div>
  );
}

export function OrderFormCard({ t, locale }: FragProps) {
  const L = t.landing;
  const money = (n: number) => formatDZD(n, locale);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-semibold">{L.sample.product}</p>
      <div className="mt-3 grid gap-3">
        <Field label={t.orderFields.name} value={L.sample.names.yacine} />
        <Field label={t.orderFields.phone} value="0661 23 45 78" ltr />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.orderFields.wilaya} value={wil(19, locale)} />
          <Field label={t.orderFields.commune} value={L.sample.communes.eulma} />
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          <span className="rounded-md bg-card py-1.5 text-center font-medium ring-1 ring-border">{t.deliveryType.HOME}</span>
          <span className="truncate py-1.5 text-center text-muted-foreground">{t.deliveryType.DESK}</span>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{t.orderFields.subtotal}</span>
          <span className="tabular-nums">{money(PRICE)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{t.orderFields.deliveryFee}</span>
          <span className="tabular-nums">{money(600)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>{t.orderFields.total}</span>
          <span className="tabular-nums">{money(4500)}</span>
        </div>
      </div>
      <span className={cn(buttonVariants({ size: "lg" }), "mt-3 h-11 w-full text-base")}>{t.publicOrder.submit}</span>
    </div>
  );
}

export function CallMini({ t }: FragProps) {
  const L = t.landing;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">
            <bdi>#1284</bdi> · <bdi>{L.sample.names.yacine}</bdi>
          </p>
          <StatusBadge status="NO_ANSWER" label={t.status.NO_ANSWER} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.confirm.attempts}: <span className="tabular-nums">2</span>
        </p>
        <div className="mt-4">
          <OutcomeButtons t={t} compact active="CONFIRMED" />
        </div>
      </div>
      <p className={cn("flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium", PILL.soft)}>
        <Check className="size-4 text-data" strokeWidth={3} />
        {fill(t.confirm.done.CONFIRMED, { number: "#1284" })}
      </p>
    </div>
  );
}

export function CourierMini({ t, locale }: FragProps) {
  const L = t.landing;
  const n = L.sample.names;
  const rows = [
    { no: 1270, name: n.lina, w: 16, tr: "yal-5H2Q8N" },
    { no: 1271, name: n.mohamed, w: 15, tr: "yal-5H2Q8P" },
    { no: 1284, name: n.yacine, w: 19, tr: "yal-5H2Q8R" },
  ];
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y text-sm">
          {rows.map((r) => (
            <li key={r.no} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <bdi>#{r.no}</bdi> · <bdi>{r.name}</bdi>
                </p>
                <p className="text-xs text-muted-foreground">{wil(r.w, locale)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status="SHIPPED" label={t.status.SHIPPED} className="h-5 px-2" />
                <bdi dir="ltr" className="text-xs text-muted-foreground">
                  {r.tr}
                </bdi>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className={cn("flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium", PILL.soft)}>
        <Send className="size-4" />
        {fill(t.courier.sent, { count: 3, courier: "Yalidine" })}
      </p>
    </div>
  );
}

export function TrailCard({ t, locale }: FragProps) {
  const L = t.landing;
  const steps: { status: OrderStatus; at: string; extra?: string }[] = [
    { status: "NEW", at: "12/11 10:42" },
    { status: "CONFIRMED", at: "12/11 14:06" },
    { status: "SHIPPED", at: "12/11 17:30", extra: "yal-5H2Q8R" },
    { status: "DELIVERED", at: "14/11 11:15", extra: formatDZD(4500, locale) },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">
          <bdi>#1284</bdi> · {L.ui.trail}
        </p>
        <ol className="mt-3 space-y-2.5">
          {steps.map((s) => (
            <li key={s.status} className="flex items-center justify-between gap-3 text-sm">
              <StatusBadge status={s.status} label={t.status[s.status]} />
              <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                {s.extra && <bdi dir="ltr" className="truncate">{s.extra}</bdi>}
                <span className="tabular-nums" dir="ltr">
                  {s.at}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
        <div className="min-w-0">
          <p className="font-medium">
            <bdi>#1255</bdi> · <bdi>{L.sample.names.samir}</bdi>
          </p>
          <p className="text-xs text-muted-foreground">
            {L.ui.returnCost}: <span className="tabular-nums">{formatDZD(450, locale)}</span>
          </p>
        </div>
        <StatusBadge status="RETURNED" label={t.status.RETURNED} />
      </div>
    </div>
  );
}

export function OrderProfitCard({ t, locale }: FragProps) {
  const L = t.landing;
  const money = (n: number) => formatDZD(n, locale);
  const lines = [
    { label: L.ui.sale, v: 4500 },
    { label: t.stats.productCost, v: -COST },
    { label: t.stats.deliveryFees, v: -600 },
    { label: L.ui.adShare, v: -770 },
  ];
  const total = lines.reduce((a, l) => a + l.v, 0);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-semibold">
        <bdi>#1284</bdi> · {L.ui.perOrder}
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        {lines.map((l) => (
          <div key={l.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{l.label}</dt>
            <dd className="tabular-nums" dir="ltr">
              {l.v < 0 ? "− " : ""}
              {money(Math.abs(l.v))}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t pt-2 text-base font-bold">
          <dt>{t.stats.profit}</dt>
          <dd className="text-positive tabular-nums" dir="ltr">
            {money(total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ---------- Phone ---------- */

/** The Confirmation screen as it looks on a phone: drawer button, queue, call buttons. */
export function PhoneScreen({ t, locale }: FragProps) {
  const L = t.landing;
  return (
    <div className="mx-auto w-[18.5rem] rounded-[2.6rem] bg-[#0f1a15] p-2.5 ring-1 ring-black/10 dark:ring-white/15">
      <div className="flex h-[36rem] flex-col overflow-hidden rounded-[2.1rem] bg-frame">
        <div className="flex h-7 items-center justify-center">
          <span className="h-1.5 w-16 rounded-full bg-foreground/15" />
        </div>
        <div className="flex h-12 items-center justify-between border-b px-3">
          <Menu className="size-5" />
          <Wordmark className="h-4.5" />
          <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold", PILL.info)}>
            5
          </span>
        </div>
        <div className="flex-1 space-y-3 overflow-hidden p-3">
          <p className="text-base font-bold">{t.pages.confirmation.title}</p>
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">
                <bdi>#1284</bdi> · <bdi>{L.sample.names.yacine}</bdi>
              </p>
              <StatusBadge status="NO_ANSWER" label={t.status.NO_ANSWER} className="h-5 px-2" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {wil(19, locale)} · {formatDZD(4500, locale)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className={cn(buttonVariants({ size: "lg" }), "h-10")} dir="ltr">
                <Phone className="size-4" />
                {t.confirm.call}
              </span>
              <span className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10")}>
                <MessageCircle className="size-4" />
                {t.confirm.whatsapp}
              </span>
            </div>
            <div className="mt-2">
              <OutcomeButtons t={t} compact />
            </div>
          </div>
          <QueueList t={t} locale={locale} current={0} className="[&>li:first-child]:hidden [&>li:nth-child(2)]:hidden" />
        </div>
      </div>
    </div>
  );
}
