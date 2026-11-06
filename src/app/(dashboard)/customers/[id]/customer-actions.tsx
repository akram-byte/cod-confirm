"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/i18n/client";
import { saveCustomerNote, setBlacklist } from "../actions";

export function BlacklistButton({ customerId, blacklisted }: { customerId: string; blacklisted: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function apply(next: boolean) {
    startTransition(async () => {
      const res = await setBlacklist(customerId, next, reason).catch(() => ({ ok: false }));
      if (res.ok) {
        toast.success(next ? t.customers.blacklisted : t.customers.unblacklisted);
        setOpen(false);
        setReason("");
        router.refresh();
      } else toast.error(t.common.error);
    });
  }

  if (blacklisted) {
    return (
      <Button variant="outline" disabled={pending} onClick={() => apply(false)}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {t.customers.unblacklist}
      </Button>
    );
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Ban className="size-4" />
        {t.customers.blacklist}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply(true);
            }}
            className="grid gap-4"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{t.customers.blacklistTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.customers.blacklistText}</AlertDialogDescription>
            </AlertDialogHeader>
            <label className="space-y-1.5 text-sm font-medium">
              <span>
                {t.customers.reason} <span className="font-normal text-muted-foreground">({t.common.optional})</span>
              </span>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.customers.reasonPlaceholder} maxLength={200} />
            </label>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">{t.common.cancel}</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {t.customers.blacklist}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CustomerNote({ customerId, note }: { customerId: string; note: string }) {
  const { t } = useI18n();
  const [value, setValue] = useState(note);
  const [saved, setSaved] = useState(note);
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      <Textarea rows={3} value={value} onChange={(e) => setValue(e.target.value)} maxLength={1000} aria-label={t.customers.note} />
      <Button
        size="sm"
        variant="outline"
        disabled={pending || value === saved}
        onClick={() =>
          startTransition(async () => {
            const res = await saveCustomerNote(customerId, value).catch(() => ({ ok: false }));
            if (res.ok) {
              setSaved(value);
              toast.success(t.common.saved);
            } else toast.error(t.common.error);
          })
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t.customers.saveNote}
      </Button>
    </div>
  );
}
