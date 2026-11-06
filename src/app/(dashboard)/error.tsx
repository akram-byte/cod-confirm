"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" />
      </div>
      <h2 className="text-base font-semibold">{t.errorPage.title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.errorPage.text}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground" dir="ltr">{error.digest}</p>}
      <div className="mt-5 flex gap-2">
        <Button onClick={() => retry()}>
          <RotateCw className="size-4" />
          {t.errorPage.retry}
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t.errorPage.home}
        </Link>
      </div>
    </div>
  );
}
