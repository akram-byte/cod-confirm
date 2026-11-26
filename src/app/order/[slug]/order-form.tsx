"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, Loader2, PackageSearch } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { trackPath } from "@/lib/tracking";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { LocationFields, feeFor, type Fees, type LocationValue } from "@/components/orders/location-fields";
import { QuantityInput } from "@/components/orders/quantity-input";
import { translateErrors, withoutError } from "@/components/orders/error-text";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import type { WilayaOption } from "@/lib/wilaya-options";
import { trackCheckoutStart, trackOrder, type PixelProduct } from "@/components/pixels";
import { normalizePhone } from "@/lib/phone";
import { savePublicDraft, submitPublicOrder, type PublicOrderState } from "./actions";

const EMPTY_LOCATION: LocationValue = { wilayaCode: "", communeId: "", deliveryType: "HOME", address: "" };

/** Random id kept in this browser, so the seller sees when one phone sends orders for many numbers. */
function deviceId() {
  try {
    let id = localStorage.getItem("cfm_device") ?? "";
    if (!/^[A-Za-z0-9]{16,64}$/.test(id)) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem("cfm_device", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function PublicOrderForm({
  product,
  wilayas,
  fees,
}: {
  product: PixelProduct;
  wilayas: WilayaOption[];
  fees: Fees;
}) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PublicOrderState | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState<LocationValue>(EMPTY_LOCATION);
  const started = useRef(false);
  // Fake-order signals: when the form was first touched.
  const startedAt = useRef(0);
  // One id per form visit, so the saved draft (abandoned order) is updated, not duplicated.
  const draftToken = useRef("");

  // Once the phone is valid, save what was typed (debounced). The seller can call back if no order follows.
  const validPhone = normalizePhone(phone);
  useEffect(() => {
    if (!validPhone || result?.ok) return;
    const id = setTimeout(() => {
      draftToken.current ||= crypto.randomUUID().replace(/-/g, "");
      savePublicDraft({
        token: draftToken.current,
        productId: product.id,
        phone: validPhone,
        customerName: name,
        wilayaCode: location.wilayaCode || null,
        communeId: location.communeId || null,
        quantity,
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(id);
  }, [validPhone, name, location.wilayaCode, location.communeId, quantity, product.id, result?.ok]);

  const clear = (...fields: string[]) => setResult((r) => withoutError(r, fields));
  const fee = feeFor(fees, location);
  const subtotal = product.price * quantity;
  const errors = result && !result.ok ? translateErrors(t, result.errors) : {};
  const formError =
    result && !result.ok && result.error
      ? result.error === "tooMany"
        ? t.publicOrder.tooMany
        : result.error === "unavailable"
          ? t.publicOrder.unavailable
          : t.common.error
      : null;

  if (result?.ok) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CircleCheck className="mb-3 size-14 text-positive" />
        <h2 className="text-xl font-semibold">{t.publicOrder.successTitle}</h2>
        <p className="mt-2 text-muted-foreground">{fill(t.publicOrder.successText, { number: `#${result.number}` })}</p>
        {result.track && (
          <>
            <Link href={trackPath(result.track)} className={buttonVariants({ className: "mt-6 h-11" })}>
              <PackageSearch className="size-4" />
              {t.publicOrder.track}
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">{t.track.saveLink}</p>
          </>
        )}
        <Button
          variant="outline"
          className="mt-6 h-11"
          onClick={() => {
            setResult(null);
            setQuantity(1);
            draftToken.current = "";
          }}
        >
          {t.publicOrder.another}
        </Button>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("productId", product.id);
    fd.set("quantity", String(quantity));
    fd.set("customerName", name);
    fd.set("phone", phone);
    fd.set("wilayaCode", location.wilayaCode);
    fd.set("communeId", location.communeId);
    fd.set("deliveryType", location.deliveryType);
    fd.set("address", location.deliveryType === "HOME" ? location.address : "");
    if (startedAt.current) fd.set("fillMs", String(Date.now() - startedAt.current));
    fd.set("deviceId", deviceId());
    startTransition(async () => {
      try {
        const res = await submitPublicOrder(fd);
        if (res.ok && res.id) trackOrder(product, { id: res.id, total: res.total, quantity });
        setResult(res);
      } catch {
        setResult({ ok: false, error: "unknown" });
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={() => {
        if (started.current) return;
        started.current = true;
        startedAt.current = Date.now();
        trackCheckoutStart(product);
      }}
      className="space-y-4"
      noValidate
    >
      {/* Honeypot: hidden from people, bots fill it. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Field id="customerName" label={t.orderFields.name} error={errors.customerName}>
        <Input
          id="customerName"
          className="h-11 text-base"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clear("customerName");
          }}
          autoComplete="name"
          maxLength={80}
          aria-invalid={!!errors.customerName}
        />
      </Field>

      <Field id="phone" label={t.orderFields.phone} error={errors.phone}>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          className="h-11 text-base rtl:text-right"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clear("phone");
          }}
          placeholder={t.orderFields.phonePlaceholder}
          autoComplete="tel"
          maxLength={20}
          aria-invalid={!!errors.phone}
        />
      </Field>

      <LocationFields
        wilayas={wilayas}
        fees={fees}
        value={location}
        onChange={(p) => {
          setLocation((l) => ({ ...l, ...p }));
          clear(...Object.keys(p));
        }}
        errors={errors}
        large
      />

      <Field id="quantity" label={t.orderFields.quantity} error={errors.quantity}>
        <QuantityInput id="quantity" value={quantity} onChange={setQuantity} large />
      </Field>

      <dl className="space-y-2 rounded-lg bg-muted/60 p-4 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t.orderFields.subtotal}</dt>
          <dd className="tabular-nums">{formatDZD(subtotal, locale)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t.orderFields.deliveryFee}</dt>
          <dd className="tabular-nums">{fee === null ? "—" : formatDZD(fee, locale)}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t pt-2 text-base font-semibold">
          <dt>{t.orderFields.total}</dt>
          <dd className="tabular-nums">{formatDZD(subtotal + (fee ?? 0), locale)}</dd>
        </div>
      </dl>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? t.publicOrder.submitting : t.publicOrder.submit}
      </Button>
    </form>
  );
}
