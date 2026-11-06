"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
import { Field } from "@/components/field";
import { LocationFields, feeFor, type Fees, type LocationValue } from "@/components/orders/location-fields";
import { QuantityInput } from "@/components/orders/quantity-input";
import { translateErrors } from "@/components/orders/error-text";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import type { WilayaOption } from "@/lib/wilaya-options";
import { saveOrder, type SaveOrderState } from "./actions";

export type EditorProduct = { id: string; name: string; price: number; active: boolean };
export type EditorInitial = {
  productId: string;
  quantity: number;
  customerName: string;
  phone: string;
  location: LocationValue;
  deliveryFee: number;
  note: string;
  /** Price snapshot kept when the product is not changed. */
  unitPrice?: number;
};

export function OrderEditor({
  orderId,
  cancelHref,
  products,
  wilayas,
  fees,
  initial,
}: {
  orderId: string | null;
  cancelHref: string;
  products: EditorProduct[];
  wilayas: WilayaOption[];
  fees: Fees;
  initial: EditorInitial;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SaveOrderState | null>(null);
  const [productId, setProductId] = useState(initial.productId);
  const [quantity, setQuantity] = useState(initial.quantity);
  const [name, setName] = useState(initial.customerName);
  const [phone, setPhone] = useState(initial.phone);
  const [location, setLocation] = useState(initial.location);
  const [fee, setFee] = useState(String(initial.deliveryFee));
  const [note, setNote] = useState(initial.note);

  const product = products.find((p) => p.id === productId);
  const unitPrice = productId === initial.productId && initial.unitPrice !== undefined ? initial.unitPrice : (product?.price ?? 0);
  const subtotal = unitPrice * quantity;
  const feeNumber = Number(fee) || 0;
  const errors = state && !state.ok ? translateErrors(t, state.errors) : {};

  function updateLocation(patch: Partial<LocationValue>) {
    const next = { ...location, ...patch };
    setLocation(next);
    // New wilaya or delivery type → refill the fee from the fee table.
    if (patch.wilayaCode !== undefined || patch.deliveryType !== undefined) {
      const auto = feeFor(fees, next);
      if (auto !== null) setFee(String(auto));
    }
  }

  function submit(force: boolean) {
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("quantity", String(quantity));
    fd.set("customerName", name);
    fd.set("phone", phone);
    fd.set("wilayaCode", location.wilayaCode);
    fd.set("communeId", location.communeId);
    fd.set("deliveryType", location.deliveryType);
    fd.set("address", location.deliveryType === "HOME" ? location.address : "");
    fd.set("deliveryFee", fee);
    fd.set("note", note);
    startTransition(async () => {
      let result: SaveOrderState;
      try {
        result = await saveOrder(orderId, fd, force);
      } catch {
        result = { ok: false, error: "unknown" };
      }
      setState(result);
      if (result.ok) {
        toast.success(result.number ? fill(t.orders.created, { number: `#${result.number}` }) : t.orders.updated);
        router.push(`/orders/${result.id}`);
      } else if (result.error) {
        toast.error(result.error === "notFound" ? t.orders.notFound : t.common.error);
      }
    });
  }

  const duplicateOf = state && !state.ok ? state.duplicateOf : undefined;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="space-y-6"
    >
      <section className="space-y-4 rounded-xl border bg-card p-4 md:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field id="productId" label={t.orderFields.product} error={errors.productId}>
            <NativeSelect
              id="productId"
              className="w-full"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              aria-invalid={!!errors.productId}
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {products.map((p) => (
                <NativeSelectOption key={p.id} value={p.id}>
                  {p.name} — {formatDZD(p.price, locale)} {!p.active ? t.orders.editor.inactiveProduct : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field id="quantity" label={t.orderFields.quantity} error={errors.quantity}>
            <QuantityInput id="quantity" value={quantity} onChange={setQuantity} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="customerName" label={t.orderFields.name} error={errors.customerName}>
            <Input
              id="customerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="rtl:text-right"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.orderFields.phonePlaceholder}
              maxLength={20}
              aria-invalid={!!errors.phone}
            />
          </Field>
        </div>

        <LocationFields wilayas={wilayas} fees={fees} value={location} onChange={updateLocation} errors={errors} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="deliveryFee" label={t.orderFields.deliveryFee} error={errors.deliveryFee} hint={t.orders.editor.feeHint}>
            <Input
              id="deliveryFee"
              inputMode="numeric"
              dir="ltr"
              className="rtl:text-right"
              value={fee}
              onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!errors.deliveryFee}
            />
          </Field>
          <Field id="note" label={t.orderFields.note} optional={t.common.optional}>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="min-w-28">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? t.common.saving : t.common.save}
          </Button>
          <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
            {t.common.cancel}
          </Link>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">{t.orderFields.total}: </span>
          <span className="text-lg font-semibold tabular-nums">{formatDZD(subtotal + feeNumber, locale)}</span>
        </p>
      </div>

      <AlertDialog open={duplicateOf !== undefined} onOpenChange={(open) => !open && setState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.orders.duplicate}</AlertDialogTitle>
            <AlertDialogDescription>
              {fill(t.orders.duplicateWarning, { number: `#${duplicateOf ?? ""}` })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setState(null);
                submit(true);
              }}
            >{t.orders.createAnyway}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
