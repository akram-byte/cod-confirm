"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { saveWhatsappTemplate } from "./whatsapp-actions";

const VARS = ["name", "store", "order", "product", "total", "wilaya"] as const;

export function WhatsappSection({ template, sample }: { template: string; sample: Record<(typeof VARS)[number], string> }) {
  const { t } = useI18n();
  const [value, setValue] = useState(template);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const preview = value.replace(/\{(\w+)\}/g, (m, k: string) => (k in sample ? sample[k as keyof typeof sample] : m));

  function insert(v: string) {
    const el = ref.current;
    const token = `{${v}}`;
    if (!el) return setValue((s) => s + token);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          {t.whatsappSettings.title}
        </CardTitle>
        <CardDescription>{t.whatsappSettings.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          ref={ref}
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={1000}
          aria-label={t.whatsappSettings.title}
        />
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">{t.whatsappSettings.placeholders}</span>
          {VARS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insert(v)}
              className="rounded-md border bg-muted/50 px-2 py-1 hover:bg-muted"
              title={t.whatsappSettings.vars[v]}
            >
              <span dir="ltr">{`{${v}}`}</span> <span className="text-muted-foreground">{t.whatsappSettings.vars[v]}</span>
            </button>
          ))}
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-sm whitespace-pre-wrap dark:bg-emerald-500/10">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{t.whatsappSettings.preview}</p>
          {preview}
        </div>
        <Button
          disabled={pending || value === template}
          onClick={() =>
            startTransition(async () => {
              const res = await saveWhatsappTemplate(value).catch(() => ({ ok: false }));
              if (res.ok) toast.success(t.common.saved);
              else toast.error(t.common.error);
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? t.common.saving : t.common.save}
        </Button>
      </CardContent>
    </Card>
  );
}
