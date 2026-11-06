"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useI18n } from "@/i18n/client";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  deleteProduct,
  saveProduct,
  setProductActive,
  type ProductErrors,
  type SaveProductState,
} from "./product-actions";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  cost: number;
  active: boolean;
  orderCount: number;
};

export function ProductsSection({ products, baseUrl }: { products: ProductRow[]; baseUrl: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [pending, startTransition] = useTransition();

  const linkOf = (slug: string) => `${baseUrl}/order/${slug}`;

  async function copy(slug: string) {
    try {
      await navigator.clipboard.writeText(linkOf(slug));
      toast.success(t.common.copied);
    } catch {
      toast.error(t.common.error);
    }
  }

  function toggle(p: ProductRow, active: boolean) {
    startTransition(async () => {
      const res = await setProductActive(p.id, active).catch(() => ({ ok: false }));
      if (res.ok) router.refresh();
      else toast.error(t.common.error);
    });
  }

  function confirmDelete() {
    const p = deleting;
    if (!p) return;
    setDeleting(null);
    startTransition(async () => {
      const res = await deleteProduct(p.id).catch(() => ({ ok: false, error: "unknown" as const }));
      if (res.ok) {
        toast.success(t.products.deleted);
        router.refresh();
      } else toast.error(res.error === "hasOrders" ? t.products.cantDelete : t.common.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{t.products.title}</CardTitle>
          <CardDescription>{t.products.description}</CardDescription>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t.products.add}
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            <Package className="mb-2 size-8" />
            {t.products.empty}
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {products.map((p) => (
              <li key={p.id} className={cn("flex flex-col gap-3 p-3 sm:flex-row sm:items-center", !p.active && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{p.name}</p>
                    {!p.active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t.products.inactive}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatDZD(p.price, locale)} · {t.products.margin} {formatDZD(p.price - p.cost, locale)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
                    /order/{p.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={p.active}
                    disabled={pending}
                    onCheckedChange={(v) => toggle(p, v)}
                    aria-label={t.products.active}
                    className="me-2"
                  />
                  <Button variant="ghost" size="icon" onClick={() => copy(p.slug)} aria-label={t.products.copyLink} title={t.products.copyLink}>
                    <Copy className="size-4" />
                  </Button>
                  <a
                    href={`/order/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t.common.open}
                    title={t.common.open}
                    className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label={t.common.edit} title={t.common.edit}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => (p.orderCount > 0 ? toast.info(t.products.cantDelete) : setDeleting(p))}
                    aria-label={t.common.delete}
                    title={t.common.delete}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing !== null && (
            <ProductForm
              key={editing === "new" ? "new" : editing.id}
              product={editing === "new" ? null : editing}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.products.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} — {t.products.deleteText}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ProductForm({ product, onDone }: { product: ProductRow | null; onDone: () => void }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<ProductErrors>({});
  const [active, setActive] = useState(product?.active ?? true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (active) fd.set("active", "on");
    startTransition(async () => {
      const res: SaveProductState = await saveProduct(product?.id ?? null, fd).catch(() => ({ ok: false, error: "unknown" }));
      if (res.ok) {
        toast.success(t.common.saved);
        onDone();
      } else {
        setErrors(res.errors ?? {});
        if (res.error) toast.error(t.common.error);
      }
    });
  }

  const err = (k: keyof ProductErrors) => (errors[k] ? t.products.errors[errors[k]!] : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>{product ? t.products.editTitle : t.products.addTitle}</DialogTitle>
      </DialogHeader>
      <Field id="p-name" label={t.products.name} error={err("name")}>
        <Input id="p-name" name="name" defaultValue={product?.name} maxLength={100} autoFocus aria-invalid={!!errors.name} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="p-price" label={t.products.price} error={err("price")}>
          <Input id="p-price" name="price" inputMode="numeric" dir="ltr" defaultValue={product?.price} aria-invalid={!!errors.price} />
        </Field>
        <Field id="p-cost" label={t.products.cost} error={err("cost")}>
          <Input id="p-cost" name="cost" inputMode="numeric" dir="ltr" defaultValue={product?.cost ?? 0} aria-invalid={!!errors.cost} />
        </Field>
      </div>
      <Field id="p-slug" label={t.products.slug} error={err("slug")} hint={t.products.slugHint} optional={product ? undefined : t.common.optional}>
        <div className="flex items-center rounded-lg border border-input focus-within:ring-3 focus-within:ring-ring/50" dir="ltr">
          <span className="ps-2.5 text-sm text-muted-foreground">/order/</span>
          <input
            id="p-slug"
            name="slug"
            defaultValue={product?.slug}
            maxLength={60}
            className="h-8 min-w-0 flex-1 bg-transparent pe-2.5 text-sm outline-none"
            aria-invalid={!!errors.slug}
          />
        </div>
      </Field>
      <Field id="p-description" label={t.products.descriptionField} optional={t.common.optional}>
        <Textarea id="p-description" name="description" rows={2} maxLength={300} defaultValue={product?.description ?? ""} />
      </Field>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        {t.products.active}
        <Switch checked={active} onCheckedChange={setActive} />
      </label>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? t.common.saving : t.common.save}
        </Button>
      </DialogFooter>
    </form>
  );
}
