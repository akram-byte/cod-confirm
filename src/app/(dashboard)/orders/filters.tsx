"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useI18n } from "@/i18n/client";

const KEYS = ["q", "status", "product", "wilaya", "from", "to"] as const;

/** Filters live in the URL (?status=NEW&…) so the page stays server-rendered and shareable. */
export function OrderFilters({
  statuses,
  products,
  wilayas,
}: {
  statuses: { value: string; label: string }[];
  products: { id: string; name: string }[];
  wilayas: { code: number; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const qRef = useRef<HTMLInputElement>(null);
  const hasFilters = KEYS.some((k) => params.get(k));

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next}`);
  }

  return (
    <div className="mb-4 space-y-3">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", qRef.current?.value.trim() ?? "");
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={qRef}
          key={params.get("q") ?? ""}
          name="q"
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder={t.orders.searchPlaceholder}
          className="h-10 ps-9"
          aria-label={t.common.search}
        />
      </form>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
        <FilterSelect label={t.orders.filters.status} value={params.get("status") ?? ""} onChange={(v) => set("status", v)}>
          {statuses.map((s) => (
            <NativeSelectOption key={s.value} value={s.value}>
              {s.label}
            </NativeSelectOption>
          ))}
        </FilterSelect>
        <FilterSelect label={t.orders.filters.product} value={params.get("product") ?? ""} onChange={(v) => set("product", v)}>
          {products.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </FilterSelect>
        <FilterSelect label={t.orders.filters.wilaya} value={params.get("wilaya") ?? ""} onChange={(v) => set("wilaya", v)}>
          {wilayas.map((w) => (
            <NativeSelectOption key={w.code} value={w.code}>
              {w.label}
            </NativeSelectOption>
          ))}
        </FilterSelect>
        <DateInput label={t.orders.filters.from} value={params.get("from") ?? ""} onChange={(v) => set("from", v)} />
        <DateInput label={t.orders.filters.to} value={params.get("to") ?? ""} onChange={(v) => set("to", v)} />
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 col-span-2 sm:col-span-1" onClick={() => router.replace(pathname)}>
            <X className="size-4" />
            {t.common.reset}
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <NativeSelect className="w-full sm:w-44 [&_select]:h-9" value={value} onChange={(e) => onChange(e.target.value)}>
        <NativeSelectOption value="">{t.common.all}</NativeSelectOption>
        {children}
      </NativeSelect>
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <Input type="date" className="h-9 w-full sm:w-40" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
