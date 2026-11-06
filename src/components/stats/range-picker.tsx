"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

const PRESETS = ["today", "7d", "30d", "month"] as const;

export function RangePicker({ from, to, preset }: { from: string; to: string; preset: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [a, setA] = useState(from);
  const [b, setB] = useState(to);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => router.replace(`${pathname}?range=${p}`)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium",
              preset === p ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.stats.ranges[p]}
          </button>
        ))}
      </div>
      <form
        className="flex flex-wrap items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (a && b) router.replace(`${pathname}?from=${a}&to=${b}`);
        }}
      >
        <Input type="date" value={a} onChange={(e) => setA(e.target.value)} className="h-8 w-36" aria-label={t.orders.filters.from} />
        <span className="text-muted-foreground">–</span>
        <Input type="date" value={b} onChange={(e) => setB(e.target.value)} className="h-8 w-36" aria-label={t.orders.filters.to} />
        <Button type="submit" size="sm" variant={preset === "custom" ? "default" : "outline"}>
          {t.stats.apply}
        </Button>
      </form>
    </div>
  );
}
