"use client";

import { useState, useTransition } from "react";
import { CircleCheck, ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { telegramCheck, telegramConnectLink, telegramDisconnect, telegramSetDaily, telegramTest } from "./telegram-actions";

export function TelegramSection({ enabled, connected, daily }: { enabled: boolean; connected: boolean; daily: boolean }) {
  const { t } = useI18n();
  const tg = t.telegramSettings;
  const [link, setLink] = useState<{ link: string; code: string } | null>(null);
  const [isConnected, setConnected] = useState(connected);
  const [dailyOn, setDaily] = useState(daily);
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<void>) => startTransition(fn);

  function connect() {
    act(async () => {
      const res = await telegramConnectLink().catch(() => ({ ok: false as const }));
      if (!res.ok) return void toast.error(t.common.error);
      setLink(res.value);
      window.open(res.value.link, "_blank", "noopener");
    });
  }

  function check() {
    act(async () => {
      const res = await telegramCheck().catch(() => ({ ok: false as const }));
      if (!res.ok) return void toast.error(t.common.error);
      if (res.value === "webhook") return void toast.error(tg.webhook, { duration: 12_000 });
      if (res.value !== "ok") return void toast.info(tg.notYet);
      setConnected(true);
      setLink(null);
      toast.success(tg.connectedToast);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-4" />
          {tg.title}
        </CardTitle>
        <CardDescription>{tg.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled ? (
          <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">{tg.notConfigured}</p>
        ) : isConnected ? (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-positive">
              <CircleCheck className="size-4" />
              {tg.connected}
            </p>
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">{tg.daily}</span>
                <span className="block text-xs text-muted-foreground">{tg.dailyHint}</span>
              </span>
              <Switch
                checked={dailyOn}
                disabled={pending}
                onCheckedChange={(v) =>
                  act(async () => {
                    setDaily(v);
                    const res = await telegramSetDaily(v).catch(() => ({ ok: false as const }));
                    if (!res.ok) {
                      setDaily(!v);
                      toast.error(t.common.error);
                    }
                  })
                }
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  act(async () => {
                    const res = await telegramTest().catch(() => ({ ok: false as const }));
                    if (res.ok && res.value) toast.success(tg.testSent);
                    else toast.error(t.common.error);
                  })
                }
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {tg.test}
              </Button>
              <Button
                variant="ghost"
                className="text-negative"
                disabled={pending}
                onClick={() =>
                  act(async () => {
                    const res = await telegramDisconnect().catch(() => ({ ok: false as const }));
                    if (res.ok) setConnected(false);
                    else toast.error(t.common.error);
                  })
                }
              >
                {tg.disconnect}
              </Button>
            </div>
          </>
        ) : (
          <>
            <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
              <li>{tg.step1}</li>
              <li>{tg.step2}</li>
              <li>{tg.step3}</li>
            </ol>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={pending} onClick={connect}>
                {pending && !link ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {tg.connect}
              </Button>
              {link && (
                <>
                  <Button variant="outline" disabled={pending} onClick={check}>
                    {pending && <Loader2 className="size-4 animate-spin" />}
                    {tg.check}
                  </Button>
                  <a href={link.link} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-3.5" />
                    {tg.openAgain}
                  </a>
                </>
              )}
            </div>
            {link && (
              <p className="text-xs text-muted-foreground">
                {tg.sendCode}{" "}
                <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground select-all">
                  {link.code}
                </code>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
