"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, MessageCircle, Phone, PhoneMissed, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge } from "@/components/risk-badge";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { saveRescue } from "./actions";

export type RescueRow = {
  id: string;
  number: number;
  customerName: string;
  phone: string;
  risk: "blacklisted" | "risky" | "ok" | undefined;
  place: string;
  deliveryType: string;
  products: string;
  total: number;
  deliveryFee: number;
  tracking: string;
  courierStatus: string;
  failedAgo: string;
  noAnswer: number;
  lastNote: string;
  whatsappHref: string;
};

type Result = "WILL_RECEIVE" | "NO_ANSWER" | "REFUSED";

export function RescueList({ rows, caller = false }: { rows: RescueRow[]; caller?: boolean }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {rows.map((r) => (
        <RescueCard key={r.id} row={r} caller={caller} />
      ))}
    </ul>
  );
}

function RescueCard({ row, caller }: { row: RescueRow; caller: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const money = (n: number) => formatDZD(n, locale);

  function save(result: Result) {
    startTransition(async () => {
      const r = await saveRescue({ orderId: row.id, result, note });
      if (!r.ok) {
        toast.error(t.common.error);
        return;
      }
      toast.success(fill(t.rescue.done[result], { number: `#${row.number}` }));
      setNote("");
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col rounded-xl border bg-card">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold">
              <bdi>#{row.number}</bdi> · <bdi>{row.customerName}</bdi>
            </h2>
            <RiskBadge risk={row.risk} labels={t.risk} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-[var(--pill-warning-bg)] px-2 font-medium text-[var(--pill-warning-ink)]">
              <Truck className="size-3" />
              <bdi>{row.courierStatus || t.rescue.markedByHand}</bdi>
            </span>
            {row.failedAgo && <span>{fill(t.rescue.ago, { time: row.failedAgo })}</span>}
            {row.noAnswer > 0 && <span>· {fill(t.rescue.noAnswerTimes, { count: row.noAnswer })}</span>}
          </p>
        </div>
        {!caller && (
          <Link
            href={`/orders/${row.id}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            {t.confirm.open}
          </Link>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${row.phone}`} className={cn(buttonVariants({ size: "lg" }), "h-11 text-base")} dir="ltr">
            <Phone className="size-4" />
            {row.phone}
          </a>
          <a
            href={row.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 text-base")}
          >
            <MessageCircle className="size-4" />
            {t.confirm.whatsapp}
          </a>
        </div>

        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{row.deliveryType}</dt>
            <dd className="min-w-0 truncate text-end">{row.place}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="min-w-0 truncate">{row.products}</dt>
            <dd className="shrink-0 font-semibold tabular-nums">{money(row.total)}</dd>
          </div>
          {row.tracking && (
            <div className="flex justify-between gap-3 text-muted-foreground">
              <dt>{t.delivery.tracking}</dt>
              <dd dir="ltr" className="font-mono text-xs">
                {row.tracking}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-3 text-muted-foreground">
            <dt>{t.rescue.loss}</dt>
            <dd className="tabular-nums">{money(row.deliveryFee)}</dd>
          </div>
        </dl>
        {row.lastNote && <p className="rounded-lg bg-muted/60 p-2 text-sm">{row.lastNote}</p>}

        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.rescue.notePlaceholder}
          aria-label={t.rescue.notePlaceholder}
          maxLength={500}
          className="mt-auto"
        />
        <div className="grid grid-cols-3 gap-2">
          <Button className="h-11" disabled={pending} onClick={() => save("WILL_RECEIVE")}>
            <Check className="size-4" />
            {t.rescue.results.WILL_RECEIVE}
          </Button>
          <Button variant="outline" className="h-11" disabled={pending} onClick={() => save("NO_ANSWER")}>
            <PhoneMissed className="size-4" />
            {t.rescue.results.NO_ANSWER}
          </Button>
          <Button variant="outline" className="h-11 text-destructive hover:text-destructive" disabled={pending} onClick={() => save("REFUSED")}>
            <X className="size-4" />
            {t.rescue.results.REFUSED}
          </Button>
        </div>
      </div>
    </li>
  );
}
