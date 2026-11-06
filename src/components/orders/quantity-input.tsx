"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuantityInput({
  id,
  value,
  onChange,
  large,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  large?: boolean;
}) {
  const size = large ? "size-11" : "size-8";
  return (
    <div className="flex w-fit items-center gap-1" dir="ltr">
      <Button type="button" variant="outline" size="icon" className={size} onClick={() => onChange(Math.max(1, value - 1))} aria-label="-">
        <Minus className="size-4" />
      </Button>
      <input
        id={id}
        inputMode="numeric"
        className={cn(
          "w-14 rounded-lg border border-input bg-transparent text-center tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          large ? "h-11 text-base" : "h-8 text-sm",
        )}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isFinite(n) ? Math.min(20, Math.max(1, n)) : 1);
        }}
      />
      <Button type="button" variant="outline" size="icon" className={size} onClick={() => onChange(Math.min(20, value + 1))} aria-label="+">
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
