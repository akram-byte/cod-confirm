"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { removePayout, savePayout } from "./actions";

export type UnpaidRow = {
  id: string;
  number: number;
  customerName: string;
  returned: boolean;
  tracking: string;
  collected: number;
  expected: number;
  ago: string;
  late: boolean;
};

export function UnpaidList({ rows, today }: { rows: UnpaidRow[]; today: string }) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const money = (n: number) => formatDZD(n, locale);
  const allSelected = selected.size === rows.length;
  const picked = rows.filter((r) => selected.has(r.id));
  const expected = picked.reduce((s, r) => s + r.expected, 0);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="sticky top-12 z-[5] -mx-1 mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-background px-1 py-2 md:top-0">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
          />
          {selected.size > 0 ? fill(t.delivery.selected, { count: selected.size }) : t.delivery.selectAll}
        </label>
        {selected.size > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            · {t.cash.expected}: {money(expected)}
          </span>
        )}
        <Button size="sm" className="ms-auto" disabled={selected.size === 0} onClick={() => setOpen(true)}>
          <Banknote className="size-4" />
          {t.cash.record}
        </Button>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{t.cash.howTo}</p>

      <ul className="divide-y rounded-xl border bg-card text-sm">
        {rows.map((r) => (
          <li key={r.id}>
            <label className={cn("flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50", selected.has(r.id) && "bg-muted/60")}>
              <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`#${r.number}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <Link href={`/orders/${r.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                    #{r.number}
                  </Link>{" "}
                  · <bdi>{r.customerName}</bdi>
                </p>
                <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  <span className={cn(r.returned && "text-negative")}>{r.returned ? t.status.RETURNED : t.status.DELIVERED}</span>
                  <span className={cn(r.late && "font-medium text-negative")}>· {fill(t.rescue.ago, { time: r.ago })}</span>
                  {r.tracking && (
                    <span dir="ltr" className="font-mono">
                      · {r.tracking}
                    </span>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className={cn("font-semibold tabular-nums", r.expected < 0 && "text-negative")}>{money(r.expected)}</p>
                {!r.returned && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t.cash.collected}: {money(r.collected)}
                  </p>
                )}
              </div>
            </label>
          </li>
        ))}
      </ul>

      <PayoutDialog
        key={open ? [...selected].join() : "closed"}
        open={open}
        onOpenChange={setOpen}
        ids={[...selected]}
        expected={expected}
        today={today}
        onSaved={() => setSelected(new Set())}
      />
    </>
  );
}

function PayoutDialog({
  open,
  onOpenChange,
  ids,
  expected,
  today,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
  expected: number;
  today: string;
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [amount, setAmount] = useState(String(Math.max(0, expected)));
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const value = Number(amount);
  const valid = amount.trim() !== "" && Number.isInteger(value) && value >= 0;
  const diff = valid ? value - expected : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !date) return;
    startTransition(async () => {
      const r = await savePayout({ ids, amount: value, receivedAt: date, note });
      if (!r.ok) {
        toast.error(t.common.error);
        return;
      }
      if (r.difference < 0) toast.warning(fill(t.cash.savedShort, { count: r.count, value: formatDZD(-r.difference, locale) }));
      else toast.success(fill(t.cash.saved, { count: r.count }));
      onSaved();
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.cash.record}</DialogTitle>
          <DialogDescription>
            {fill(t.cash.parcels, { count: ids.length })} · {t.cash.expected}: {formatDZD(expected, locale)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium">
            {t.cash.amount}
            <Input
              inputMode="numeric"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              aria-invalid={!valid}
              autoFocus
            />
          </label>
          {valid && diff !== 0 && (
            <p className={cn("text-sm", diff < 0 ? "text-negative" : "text-muted-foreground")}>
              {diff < 0 ? fill(t.cash.short, { value: formatDZD(-diff, locale) }) : fill(t.cash.extra, { value: formatDZD(diff, locale) })}
            </p>
          )}
          <label className="grid gap-1.5 text-sm font-medium">
            {t.cash.date}
            <Input type="date" dir="ltr" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            {t.cash.note}
            <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder={t.cash.notePlaceholder} />
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending || !valid || !date}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t.cash.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeletePayoutButton({ id }: { id: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button size="icon" variant="ghost" className="size-8" aria-label={t.cash.delete} title={t.cash.delete} onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.cash.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.cash.deleteText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await removePayout(id);
                  if (!r.ok) toast.error(t.common.error);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {t.cash.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
