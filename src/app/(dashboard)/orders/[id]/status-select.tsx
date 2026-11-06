"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useI18n } from "@/i18n/client";
import { changeOrderStatus } from "../actions";

export function StatusSelect({ orderId, status, statuses }: { orderId: string; status: string; statuses: readonly string[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t.orders.detail.changeStatus}</span>
      <NativeSelect
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          startTransition(async () => {
            const res = await changeOrderStatus(orderId, next).catch(() => ({ ok: false }));
            if (res.ok) {
              toast.success(t.orders.detail.statusChanged);
              router.refresh();
            } else {
              setValue(prev);
              toast.error(t.common.error);
            }
          });
        }}
      >
        {statuses.map((s) => (
          <NativeSelectOption key={s} value={s}>
            {t.status[s as keyof typeof t.status]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
