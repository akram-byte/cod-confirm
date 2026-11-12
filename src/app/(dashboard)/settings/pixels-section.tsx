"use client";

import { useState, useTransition } from "react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { savePixels } from "./pixel-actions";

export function PixelsSection({ fb, tiktok }: { fb: string; tiktok: string }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState({ fb, tiktok });
  const [fbValue, setFb] = useState(fb);
  const [ttValue, setTt] = useState(tiktok);
  const [error, setError] = useState<"fb" | "tiktok" | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = fbValue.trim() !== saved.fb || ttValue.trim().toUpperCase() !== saved.tiktok;

  function save() {
    startTransition(async () => {
      const res = await savePixels(fbValue, ttValue).catch(() => ({ ok: false as const, field: null }));
      if (!res.ok) {
        setError(res.field);
        toast.error(res.field ? t.pixelSettings.invalid : t.common.error);
        return;
      }
      setError(null);
      setSaved({ fb: res.fb, tiktok: res.tiktok });
      setFb(res.fb);
      setTt(res.tiktok);
      toast.success(t.common.saved);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4" />
          {t.pixelSettings.title}
        </CardTitle>
        <CardDescription>{t.pixelSettings.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="fbPixel" label={t.pixelSettings.fb} error={error === "fb" ? t.pixelSettings.fbInvalid : undefined}>
            <Input
              id="fbPixel"
              dir="ltr"
              inputMode="numeric"
              placeholder="123456789012345"
              value={fbValue}
              onChange={(e) => {
                setFb(e.target.value);
                if (error === "fb") setError(null);
              }}
              aria-invalid={error === "fb"}
              maxLength={30}
            />
          </Field>
          <Field id="ttPixel" label={t.pixelSettings.tiktok} error={error === "tiktok" ? t.pixelSettings.tiktokInvalid : undefined}>
            <Input
              id="ttPixel"
              dir="ltr"
              placeholder="CQ1ABC2DEFG3HIJ4KLM5"
              value={ttValue}
              onChange={(e) => {
                setTt(e.target.value);
                if (error === "tiktok") setError(null);
              }}
              aria-invalid={error === "tiktok"}
              maxLength={40}
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">{t.pixelSettings.help}</p>
        <Button disabled={pending || !changed} onClick={save}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? t.common.saving : t.common.save}
        </Button>
      </CardContent>
    </Card>
  );
}
