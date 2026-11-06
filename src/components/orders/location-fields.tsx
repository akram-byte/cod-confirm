"use client";

import { Home, Store } from "lucide-react";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { formatDZD } from "@/lib/money";
import type { WilayaOption } from "@/lib/wilaya-options";

export type Fees = Record<number, { home: number; desk: number }>;
export type LocationValue = {
  wilayaCode: string;
  communeId: string;
  deliveryType: "HOME" | "DESK";
  address: string;
};
type Errors = Partial<Record<"wilayaCode" | "communeId" | "address", string>>;

export function feeFor(fees: Fees, v: LocationValue): number | null {
  const f = fees[Number(v.wilayaCode)];
  if (!f) return null;
  return v.deliveryType === "HOME" ? f.home : f.desk;
}

/** Wilaya → commune → delivery type → address. Controlled by the parent form. */
export function LocationFields({
  wilayas,
  fees,
  value,
  onChange,
  errors,
  large,
}: {
  wilayas: WilayaOption[];
  fees: Fees;
  value: LocationValue;
  onChange: (patch: Partial<LocationValue>) => void;
  errors: Errors;
  large?: boolean;
}) {
  const { t, locale } = useI18n();
  const wilaya = wilayas.find((w) => String(w.code) === value.wilayaCode);
  const wilayaFees = fees[Number(value.wilayaCode)];
  const inputSize = large ? "h-11 text-base" : undefined;
  const selectClass = cn("w-full", large && "[&_select]:h-11 [&_select]:text-base");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="wilayaCode" label={t.orderFields.wilaya} error={errors.wilayaCode}>
          <NativeSelect
            id="wilayaCode"
            className={selectClass}
            value={value.wilayaCode}
            onChange={(e) => onChange({ wilayaCode: e.target.value, communeId: "" })}
            aria-invalid={!!errors.wilayaCode}
          >
            <NativeSelectOption value="">{t.orderFields.chooseWilaya}</NativeSelectOption>
            {wilayas.map((w) => (
              <NativeSelectOption key={w.code} value={w.code}>
                {w.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field id="communeId" label={t.orderFields.commune} error={errors.communeId}>
          <NativeSelect
            id="communeId"
            className={selectClass}
            value={value.communeId}
            onChange={(e) => onChange({ communeId: e.target.value })}
            disabled={!wilaya}
            aria-invalid={!!errors.communeId}
          >
            <NativeSelectOption value="">{t.orderFields.chooseCommune}</NativeSelectOption>
            {wilaya?.communes.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {wilaya && !wilayaFees && <p className="text-sm text-destructive">{t.orderFields.notDelivered}</p>}

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">{t.orderFields.deliveryType}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["HOME", "DESK"] as const).map((type) => {
            const Icon = type === "HOME" ? Home : Store;
            const fee = wilayaFees ? (type === "HOME" ? wilayaFees.home : wilayaFees.desk) : null;
            const checked = value.deliveryType === type;
            return (
              <label
                key={type}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value={type}
                  checked={checked}
                  onChange={() => onChange({ deliveryType: type })}
                  className="sr-only"
                />
                <Icon className={cn("size-5 shrink-0", checked ? "text-primary" : "text-muted-foreground")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{t.deliveryType[type]}</span>
                  {fee !== null && (
                    <span className="block text-xs text-muted-foreground tabular-nums">{formatDZD(fee, locale)}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {value.deliveryType === "HOME" && (
        <Field id="address" label={t.orderFields.address} optional={t.common.optional} error={errors.address}>
          <Input
            id="address"
            className={inputSize}
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder={t.orderFields.addressPlaceholder}
            maxLength={200}
            autoComplete="street-address"
          />
        </Field>
      )}
    </>
  );
}
