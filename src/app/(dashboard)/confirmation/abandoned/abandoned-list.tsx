"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, PhoneMissed, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { saveDraftResult } from "./actions";

export type AbandonedRow = {
  id: string;
  customerName: string;
  phone: string;
  product: string;
  value: number;
  place: string;
  ago: string;
  noAnswer: number;
  whatsappHref: string;
};

export function AbandonedList({ rows }: { rows: AbandonedRow[] }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {rows.map((r) => (
        <AbandonedCard key={r.id} row={r} />
      ))}
    </ul>
  );
}

function AbandonedCard({ row }: { row: AbandonedRow }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function save(result: "NO_ANSWER" | "DISMISSED") {
    startTransition(async () => {
      const r = await saveDraftResult({ id: row.id, result });
      if (!r.ok) {
        toast.error(t.common.error);
        return;
      }
      toast.success(result === "NO_ANSWER" ? t.abandoned.doneNoAnswer : t.abandoned.doneDismissed);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">
            <bdi>{row.customerName || t.abandoned.noName}</bdi>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fill(t.rescue.ago, { time: row.ago })}
            {row.noAnswer > 0 && ` · ${fill(t.rescue.noAnswerTimes, { count: row.noAnswer })}`}
          </p>
        </div>
        <span className="shrink-0 font-semibold tabular-nums">{formatDZD(row.value, locale)}</span>
      </div>

      <div className="text-sm">
        <p className="truncate">{row.product}</p>
        {row.place && <p className="truncate text-muted-foreground">{row.place}</p>}
      </div>

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

      <div className="mt-auto grid grid-cols-[1.4fr_1fr_1fr] gap-2">
        <Link href={`/orders/new?draft=${row.id}`} className={cn(buttonVariants(), "h-11")}>
          <Plus className="size-4" />
          {t.abandoned.createOrder}
        </Link>
        <Button variant="outline" className="h-11" disabled={pending} onClick={() => save("NO_ANSWER")}>
          <PhoneMissed className="size-4" />
          {t.rescue.results.NO_ANSWER}
        </Button>
        <Button variant="outline" className="h-11 text-destructive hover:text-destructive" disabled={pending} onClick={() => save("DISMISSED")}>
          <X className="size-4" />
          {t.abandoned.notInterested}
        </Button>
      </div>
    </li>
  );
}
