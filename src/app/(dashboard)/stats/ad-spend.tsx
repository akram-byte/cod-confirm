"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { formatDZD } from "@/lib/money";
import { saveAdSpend } from "./actions";

export type AdEntry = { day: string; productId: string; amount: number };

/**
 * Daily ad spend. "All products" is the general spend; picking a product records that
 * product's campaign, so Stats can show the ad cost per delivered order for each product.
 */
export function AdSpendCard({
  today,
  entries,
  products,
}: {
  today: string;
  entries: AdEntry[];
  products: { id: string; name: string }[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [day, setDay] = useState(today);
  const [productId, setProductId] = useState("");
  const find = (d: string, p: string) => entries.find((e) => e.day === d && e.productId === p)?.amount;
  const [amount, setAmount] = useState(() => String(find(today, "") ?? ""));
  const [pending, startTransition] = useTransition();
  const total = entries.reduce((n, e) => n + e.amount, 0);
  const nameOf = new Map(products.map((p) => [p.id, p.name]));

  function pick(d: string, p: string) {
    setDay(d);
    setProductId(p);
    setAmount(String(find(d, p) ?? ""));
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
              const res = await saveAdSpend(day, amount.trim(), productId).catch(() => ({ ok: false as const }));
              if (res.ok) {
                toast.success(t.stats.adSaved);
                router.refresh();
              } else toast.error(t.common.error);
            });
          }}
        >
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{t.stats.adDate}</span>
            <Input type="date" value={day} max={today} onChange={(e) => pick(e.target.value, productId)} className="h-9 w-40" required />
          </label>
          {products.length > 0 && (
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{t.stats.adProduct}</span>
              <NativeSelect value={productId} onChange={(e) => pick(day, e.target.value)} className="h-9 w-44">
                <NativeSelectOption value="">{t.stats.adAllProducts}</NativeSelectOption>
                {products.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
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
                <li key={`${e.day}-${e.productId}`}>
                  <button
                    type="button"
                    onClick={() => pick(e.day, e.productId)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-muted/50"
                  >
                    <span className="min-w-0 truncate">
                      <span className="tabular-nums">{e.day.split("-").reverse().join("/")}</span>
                      <span className="text-muted-foreground"> · {e.productId ? (nameOf.get(e.productId) ?? "—") : t.stats.adAllProducts}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatDZD(e.amount, locale)}</span>
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
