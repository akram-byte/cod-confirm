"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { formatDZD } from "@/lib/money";
import { saveAdSpend } from "./actions";

export function AdSpendCard({ today, entries }: { today: string; entries: { day: string; amount: number }[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [day, setDay] = useState(today);
  const [amount, setAmount] = useState(() => String(entries.find((e) => e.day === today)?.amount ?? ""));
  const [pending, startTransition] = useTransition();
  const total = entries.reduce((n, e) => n + e.amount, 0);

  function pickDay(d: string) {
    setDay(d);
    setAmount(String(entries.find((e) => e.day === d)?.amount ?? ""));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="size-4" />
          {t.stats.adTitle}
        </CardTitle>
        <CardDescription>{t.stats.adDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\d+$/.test(amount.trim())) {
              toast.error(t.stats.adInvalid);
              return;
            }
            startTransition(async () => {
              const res = await saveAdSpend(day, amount.trim()).catch(() => ({ ok: false as const }));
              if (res.ok) {
                toast.success(t.stats.adSaved);
                router.refresh();
              } else toast.error(t.common.error);
            });
          }}
        >
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{t.stats.adDate}</span>
            <Input type="date" value={day} max={today} onChange={(e) => pickDay(e.target.value)} className="h-9 w-40" required />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{t.stats.adAmount}</span>
            <Input
              inputMode="numeric"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              className="h-9 w-36 rtl:text-right"
              placeholder="0"
            />
          </label>
          <Button type="submit" className="h-9" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t.stats.adSave}
          </Button>
        </form>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.stats.adNone}</p>
        ) : (
          <div className="rounded-lg border">
            <ul className="max-h-64 divide-y overflow-y-auto text-sm">
              {entries.map((e) => (
                <li key={e.day}>
                  <button
                    type="button"
                    onClick={() => pickDay(e.day)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-muted/50"
                  >
                    <span className="tabular-nums">{e.day.split("-").reverse().join("/")}</span>
                    <span className="tabular-nums">{formatDZD(e.amount, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t bg-muted/40 px-3 py-2 text-sm font-medium">
              <span>{t.stats.adTotal}</span>
              <span className="tabular-nums">{formatDZD(total, locale)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
