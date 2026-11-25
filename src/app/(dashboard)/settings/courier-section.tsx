"use client";

import { useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { checkCourierConnection, type CourierCheckState } from "./courier-actions";

/** Shown when COURIER is set: a read-only check of the keys and of every commune, before the first real parcel. */
export function CourierSection({ label }: { label: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<CourierCheckState | null>(null);
  const [pending, startTransition] = useTransition();
  const r = state?.ok ? state.result : null;
  const good = r && r.missing.length === 0 && r.homeDesks !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-4" />
          {fill(t.courierSettings.title, { courier: label })}
        </CardTitle>
        <CardDescription>{t.courierSettings.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(await checkCourierConnection().catch((e): CourierCheckState => ({ ok: false, message: String(e) })));
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? t.courierSettings.checking : t.courierSettings.check}
        </Button>

        {state && !state.ok && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              {t.courierSettings.failed} <bdi dir="ltr">{state.message}</bdi>
            </span>
          </p>
        )}

        {r && (
          <div className="space-y-3 text-sm">
            <p className={cn("flex items-center gap-2 font-medium", good ? "text-foreground" : "text-destructive")}>
              {good ? <CircleCheck className="size-4 text-primary" /> : <CircleAlert className="size-4" />}
              {good ? t.courierSettings.allGood : t.courierSettings.needsWork}
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>{fill(t.courierSettings.connected, { courier: r.courier, count: r.courierWilayas })}</li>
              <li>{fill(t.courierSettings.communes, { matched: r.matched, total: r.communes })}</li>
              {r.moved > 0 && <li>{fill(t.courierSettings.moved, { count: r.moved })}</li>}
              <li>
                {r.homeDesks === null
                  ? fill(t.courierSettings.homeMissing, { wilaya: r.homeWilaya })
                  : fill(t.courierSettings.homeDesks, { wilaya: r.homeWilaya, count: r.homeDesks })}
              </li>
            </ul>
            {r.missing.length > 0 && (
              <details className="rounded-lg border">
                <summary className="cursor-pointer px-3 py-2 font-medium">
                  {fill(t.courierSettings.missing, { count: r.missing.length })}
                </summary>
                <p className="px-3 pb-2 text-muted-foreground">{t.courierSettings.missingHelp}</p>
                <ul className="max-h-64 divide-y overflow-y-auto border-t" dir="ltr">
                  {r.missing.map((m) => (
                    <li key={`${m.wilaya}-${m.commune}`} className="flex justify-between gap-3 px-3 py-1.5">
                      <span>{m.commune}</span>
                      <span className="text-muted-foreground">{m.wilaya}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
