"use client";

import { useState } from "react";
import { Copy, MessagesSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";

type Item = { name: string; slug: string };

// Ready-made auto-reply for Messenger / Instagram / WhatsApp Business.
// The seller pastes it into Meta's own free auto-reply tools: no API, no cost.
export function AutoReplySection({ store, products, baseUrl }: { store: string; products: Item[]; baseUrl: string }) {
  const { t } = useI18n();
  const a = t.autoReply;
  const build = () =>
    [
      a.greeting.replace("{store}", store || a.defaultStore),
      a.intro,
      ...products.map((p) => `• ${p.name}: ${baseUrl}/order/${p.slug}`),
      a.outro,
    ].join("\n");
  const [value, setValue] = useState(build);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.common.copied);
    } catch {
      toast.error(t.common.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessagesSquare className="size-4" />
          {a.title}
        </CardTitle>
        <CardDescription>{a.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{a.noProducts}</p>
        ) : (
          <>
            <Textarea rows={6} value={value} onChange={(e) => setValue(e.target.value)} aria-label={a.title} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copy}>
                <Copy className="size-4" />
                {a.copy}
              </Button>
              <Button variant="outline" onClick={() => setValue(build())}>
                <RotateCcw className="size-4" />
                {a.reset}
              </Button>
            </div>
          </>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Steps title={a.messengerTitle} steps={a.messengerSteps} />
          <Steps title={a.whatsappTitle} steps={a.whatsappSteps} />
        </div>
      </CardContent>
    </Card>
  );
}

function Steps({ title, steps }: { title: string; steps: readonly string[] }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-sm">
      <p className="mb-2 font-medium">{title}</p>
      <ol className="list-decimal space-y-1 ps-5 text-muted-foreground">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
