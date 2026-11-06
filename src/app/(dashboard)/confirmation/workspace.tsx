"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Copy, ExternalLink, Loader2, MessageCircle, Phone, PhoneMissed, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { RiskBadge } from "@/components/risk-badge";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CallOutcome, OrderStatus } from "@/generated/prisma/enums";
import { recordCall } from "./actions";

type Risk = "blacklisted" | "risky" | "ok" | undefined;

export type QueueRow = {
  id: string;
  risk: Risk;
  number: number;
  customerName: string;
  wilaya: string;
  status: OrderStatus;
  attempts: number;
  time: string;
};

export type CurrentOrder = {
  id: string;
  customerId: string;
  risk: Risk;
  number: number;
  status: OrderStatus;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  deliveryType: string;
  address: string | null;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  attempts: number;
  duplicate: boolean;
  note: string | null;
  createdAt: string;
  callbackAt: string | null;
  calls: { id: string; outcome: CallOutcome; note: string | null; at: string }[];
  whatsappHref: string;
};

export function ConfirmationWorkspace({
  current,
  queue,
  nextId,
}: {
  current: CurrentOrder;
  queue: QueueRow[];
  nextId: string | null;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* key: fresh note + dialog state for every order */}
        <CallCard key={current.id} order={current} nextId={nextId} />
      </div>
      <aside>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t.confirm.queueTitle}</h2>
        <ul className="max-h-[70vh] divide-y overflow-y-auto rounded-xl border bg-card text-sm">
          {queue.map((o) => (
            <li key={o.id}>
              <Link
                href={`/confirmation?id=${o.id}`}
                replace
                className={cn("block p-3 hover:bg-muted/50", o.id === current.id && "bg-primary/5 ring-1 ring-inset ring-primary/30")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">
                    <bdi>#{o.number}</bdi> · <bdi>{o.customerName}</bdi>
                  </span>
                  <StatusBadge status={o.status} label={t.status[o.status]} className="h-5 px-2" />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{o.wilaya}</span>
                    <RiskBadge risk={o.risk} labels={t.risk} />
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {o.attempts > 0 && `${o.attempts}× · `}
                    {o.time}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

const OUTCOME_STYLE: Record<CallOutcome, string> = {
  CONFIRMED: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  NO_ANSWER: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
  CALLBACK: "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
  CANCELLED: "border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10",
};
const OUTCOME_ICON = { CONFIRMED: Check, NO_ANSWER: PhoneMissed, CALLBACK: CalendarClock, CANCELLED: X };
const OUTCOMES: CallOutcome[] = ["CONFIRMED", "NO_ANSWER", "CALLBACK", "CANCELLED"];

function CallCard({ order, nextId }: { order: CurrentOrder; nextId: string | null }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [callbackOpen, setCallbackOpen] = useState(false);
  const money = (n: number) => formatDZD(n, locale);

  const goNext = useCallback(() => {
    router.replace(nextId ? `/confirmation?id=${nextId}` : "/confirmation");
  }, [router, nextId]);

  const act = useCallback(
    (outcome: CallOutcome, callbackAt?: Date) => {
      if (pending) return;
      startTransition(async () => {
        const res = await recordCall({
          orderId: order.id,
          outcome,
          note,
          callbackAt: callbackAt ? callbackAt.toISOString() : null,
        }).catch(() => ({ ok: false as const, error: "unknown" as const }));
        if (res.ok) {
          toast.success(fill(t.confirm.done[outcome], { number: `#${order.number}` }));
          setCallbackOpen(false);
          goNext();
        } else if (res.error === "notCallable" || res.error === "notFound") {
          toast.info(t.confirm.notCallable);
          goNext();
        } else if (res.error === "callbackAt") {
          toast.error(t.confirm.callbackInvalid);
        } else {
          toast.error(t.common.error);
        }
      });
    },
    [pending, order.id, order.number, note, t, goNext],
  );

  // Keyboard: 1-4 outcomes, S skip. Ignored while typing or when a dialog is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (callbackOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "1") act("CONFIRMED");
      else if (e.key === "2") act("NO_ANSWER");
      else if (e.key === "3") setCallbackOpen(true);
      else if (e.key === "4") act("CANCELLED");
      else if ((e.key === "s" || e.key === "S") && nextId) goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, callbackOpen, goNext, nextId]);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              <bdi>#{order.number}</bdi> · <bdi>{order.customerName}</bdi>
            </h2>
            <StatusBadge status={order.status} label={t.status[order.status]} />
            <RiskBadge risk={order.risk} labels={t.risk} className="h-6 px-2.5" />
            {order.duplicate && (
              <span
                title={t.orders.duplicateHint}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-orange-100 px-2.5 text-xs font-medium text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
              >
                <Copy className="size-3" />
                {t.orders.duplicate}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.createdAt} · {t.confirm.attempts}: <span className="tabular-nums">{order.attempts}</span>
            {order.callbackAt && ` · ${t.confirm.due}: ${order.callbackAt}`}
          </p>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-4" />
          {t.confirm.open}
        </Link>
      </div>

      <div className="space-y-4 p-4">
        {/* Contact */}
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${order.phone}`} className={cn(buttonVariants({ size: "lg" }), "h-11 text-base")} dir="ltr">
            <Phone className="size-4" />
            {order.phone}
          </a>
          <a
            href={order.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 text-base text-emerald-700 dark:text-emerald-400")}
          >
            <MessageCircle className="size-4" />
            {t.confirm.whatsapp}
          </a>
        </div>

        {/* Order summary */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="font-medium">{order.wilaya}</p>
            <p>{order.commune}</p>
            <p className="text-muted-foreground">{order.deliveryType}</p>
            {order.address && <p className="text-muted-foreground">{order.address}</p>}
          </div>
          <div className="space-y-1 text-sm">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {i.name} <span className="text-muted-foreground tabular-nums">×{i.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">{money(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>{t.orderFields.deliveryFee}</span>
              <span className="tabular-nums">{money(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t pt-1 text-base font-semibold">
              <span>{t.orderFields.total}</span>
              <span className="tabular-nums">{money(order.total)}</span>
            </div>
          </div>
        </div>
        {order.note && <p className="rounded-lg bg-muted/60 p-3 text-sm">{order.note}</p>}

        {/* Outcome */}
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.confirm.notePlaceholder}
          maxLength={500}
          aria-label={t.confirm.notePlaceholder}
        />
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {OUTCOMES.map((o, i) => {
            const Icon = OUTCOME_ICON[o];
            return (
              <Button
                key={o}
                type="button"
                disabled={pending}
                onClick={() => (o === "CALLBACK" ? setCallbackOpen(true) : act(o))}
                className={cn("h-12 text-base", OUTCOME_STYLE[o])}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                {t.confirm.outcomes[o]}
                <kbd className="ms-1 hidden rounded border border-current/30 px-1 text-[10px] opacity-70 lg:inline">{i + 1}</kbd>
              </Button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="hidden text-xs text-muted-foreground md:block">{t.confirm.shortcuts}</p>
          <Button type="button" variant="ghost" size="sm" disabled={!nextId || pending} onClick={goNext} className="ms-auto">
            <SkipForward className="size-4 rtl:rotate-180" />
            {t.confirm.skip}
          </Button>
        </div>

        {order.calls.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t.confirm.previousCalls}</h3>
            <ul className="space-y-2 text-sm">
              {order.calls.map((c) => (
                <li key={c.id} className="flex flex-wrap justify-between gap-x-3 rounded-lg bg-muted/40 px-3 py-2">
                  <span className="font-medium">{t.status[c.outcome]}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{c.at}</span>
                  {c.note && <p className="w-full text-muted-foreground">{c.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <CallbackDialog
        open={callbackOpen}
        onOpenChange={setCallbackOpen}
        pending={pending}
        onPick={(date) => act("CALLBACK", date)}
      />
    </div>
  );
}

/** "2026-11-06T14:30" in the browser's local time. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CallbackDialog({
  open,
  onOpenChange,
  pending,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onPick: (date: Date) => void;
}) {
  const { t } = useI18n();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState(false);

  const inHours = (h: number) => new Date(Date.now() + h * 3_600_000);
  const tomorrow10 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setError(false);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.confirm.callbackTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="outline" className="h-11 justify-start" disabled={pending} onClick={() => onPick(inHours(1))}>
            {t.confirm.callbackIn1h}
          </Button>
          <Button variant="outline" className="h-11 justify-start" disabled={pending} onClick={() => onPick(inHours(3))}>
            {t.confirm.callbackIn3h}
          </Button>
          <Button variant="outline" className="h-11 justify-start" disabled={pending} onClick={() => onPick(tomorrow10())}>
            {t.confirm.callbackTomorrow}
          </Button>
        </div>
        <form
          className="space-y-2 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new Date(custom);
            if (!custom || isNaN(d.getTime()) || d.getTime() <= Date.now()) {
              setError(true);
              return;
            }
            onPick(d);
          }}
        >
          <label htmlFor="callback-at" className="text-sm font-medium">
            {t.confirm.callbackCustom}
          </label>
          <Input
            id="callback-at"
            type="datetime-local"
            dir="ltr"
            value={custom}
            min={toLocalInput(new Date())}
            onChange={(e) => {
              setCustom(e.target.value);
              setError(false);
            }}
            aria-invalid={error}
          />
          {error && <p className="text-sm text-destructive">{t.confirm.callbackInvalid}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t.confirm.callbackSave}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
