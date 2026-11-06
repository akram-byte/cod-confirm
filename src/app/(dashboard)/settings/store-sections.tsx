"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Search, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/field";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { changePassword, saveDeliveryFees, saveStoreName, type PasswordState } from "./store-actions";

export function StoreNameSection({ name }: { name: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="size-4" />
          {t.storeSettings.title}
        </CardTitle>
        <CardDescription>{t.storeSettings.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await saveStoreName(value).catch(() => ({ ok: false }));
              if (res.ok) {
                toast.success(t.common.saved);
                router.refresh();
              } else toast.error(t.common.error);
            });
          }}
        >
          <Field id="storeName" label={t.storeSettings.storeName} className="min-w-0 flex-1 sm:max-w-sm">
            <Input id="storeName" value={value} onChange={(e) => setValue(e.target.value)} maxLength={60} required />
          </Field>
          <Button type="submit" disabled={pending || !value.trim() || value.trim() === name}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t.common.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export type FeeRow = { wilayaCode: number; label: string; homeFee: number; deskFee: number; active: boolean };
type Draft = { homeFee: string; deskFee: string; active: boolean };

export function DeliveryFeesSection({ rows }: { rows: FeeRow[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.label.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const valueOf = (r: FeeRow): Draft =>
    drafts[r.wilayaCode] ?? { homeFee: String(r.homeFee), deskFee: String(r.deskFee), active: r.active };

  function edit(r: FeeRow, patch: Partial<Draft>) {
    setDrafts((d) => {
      const next = { ...valueOf(r), ...patch };
      const same = next.homeFee === String(r.homeFee) && next.deskFee === String(r.deskFee) && next.active === r.active;
      const copy = { ...d };
      if (same) delete copy[r.wilayaCode];
      else copy[r.wilayaCode] = next;
      return copy;
    });
  }

  const changed = Object.keys(drafts).length;

  function save() {
    const entries = Object.entries(drafts);
    if (entries.some(([, d]) => !/^\d+$/.test(d.homeFee) || !/^\d+$/.test(d.deskFee))) {
      toast.error(t.feesSettings.invalid);
      return;
    }
    const payload = entries.map(([code, d]) => ({
      wilayaCode: Number(code),
      homeFee: Number(d.homeFee),
      deskFee: Number(d.deskFee),
      active: d.active,
    }));
    startTransition(async () => {
      const res = await saveDeliveryFees(payload).catch(() => ({ ok: false }));
      if (res.ok) {
        toast.success(t.feesSettings.saved);
        setDrafts({});
        router.refresh();
      } else toast.error(t.feesSettings.invalid);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-4" />
          {t.feesSettings.title}
        </CardTitle>
        <CardDescription>{t.feesSettings.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.feesSettings.search}
            className="ps-9"
            aria-label={t.feesSettings.search}
          />
        </div>

        <div className="max-h-[28rem] overflow-y-auto rounded-lg border">
          <div className="sticky top-0 z-[1] grid grid-cols-[1fr_5rem_5rem_3rem] items-center gap-2 border-b bg-muted px-3 py-2 text-xs font-medium text-muted-foreground sm:grid-cols-[1fr_7rem_7rem_4rem]">
            <span>{t.feesSettings.wilaya}</span>
            <span>{t.feesSettings.home}</span>
            <span>{t.feesSettings.desk}</span>
            <span className="text-center">{t.feesSettings.active}</span>
          </div>
          <ul className="divide-y">
            {visible.map((r) => {
              const v = valueOf(r);
              const dirty = r.wilayaCode in drafts;
              return (
                <li
                  key={r.wilayaCode}
                  className={cn(
                    "grid grid-cols-[1fr_5rem_5rem_3rem] items-center gap-2 px-3 py-1.5 sm:grid-cols-[1fr_7rem_7rem_4rem]",
                    dirty && "bg-[var(--pill-warning-bg)]",
                    !v.active && "text-muted-foreground",
                  )}
                >
                  <span className="truncate text-sm">{r.label}</span>
                  <FeeInput value={v.homeFee} onChange={(x) => edit(r, { homeFee: x })} label={`${r.label} ${t.feesSettings.home}`} disabled={!v.active} />
                  <FeeInput value={v.deskFee} onChange={(x) => edit(r, { deskFee: x })} label={`${r.label} ${t.feesSettings.desk}`} disabled={!v.active} />
                  <span className="flex justify-center">
                    <Switch checked={v.active} onCheckedChange={(x) => edit(r, { active: x })} aria-label={`${r.label} ${t.feesSettings.active}`} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{changed > 0 && fill(t.feesSettings.changed, { count: changed })}</span>
          <div className="flex gap-2">
            {changed > 0 && (
              <Button variant="ghost" onClick={() => setDrafts({})} disabled={pending}>
                {t.common.cancel}
              </Button>
            )}
            <Button onClick={save} disabled={pending || changed === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t.feesSettings.saveChanges}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeeInput({ value, onChange, label, disabled }: { value: string; onChange: (v: string) => void; label: string; disabled: boolean }) {
  return (
    <input
      inputMode="numeric"
      dir="ltr"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      aria-label={label}
      className="h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 rtl:text-right"
    />
  );
}

export function PasswordSection() {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<PasswordState | null>(null);
  const [pending, startTransition] = useTransition();
  const error = state?.error ? t.passwordSettings.errors[state.error] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {t.passwordSettings.title}
        </CardTitle>
        <CardDescription>{t.passwordSettings.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await changePassword(current, next, confirm).catch(() => ({ ok: false, error: "unknown" as const }));
              setState(res);
              if (res.ok) {
                toast.success(t.passwordSettings.changed);
                setCurrent("");
                setNext("");
                setConfirm("");
              }
            });
          }}
        >
          <Field id="pw-current" label={t.passwordSettings.current}>
            <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field id="pw-next" label={t.passwordSettings.next} hint={t.passwordSettings.errors.short}>
            <Input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
          </Field>
          <Field id="pw-confirm" label={t.passwordSettings.confirm}>
            <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending || !current || !next || !confirm} className="w-fit">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t.passwordSettings.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
