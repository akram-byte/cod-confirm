"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/** The customer's tracking link, ready to copy into WhatsApp or Messenger. */
export function TrackLink({ url }: { url: string }) {
  const { t } = useI18n();
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.copied);
    } catch {
      toast.error(t.common.error);
    }
  }
  return (
    <div className="space-y-2">
      <p dir="ltr" className="truncate rounded-md bg-muted/60 px-2 py-1.5 font-mono text-xs rtl:text-right" title={url}>
        {url}
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy className="size-3.5" />
          {t.common.copy}
        </Button>
        <a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "ghost" })}>
          <ExternalLink className="size-3.5" />
          {t.orders.detail.open}
        </a>
      </div>
    </div>
  );
}
