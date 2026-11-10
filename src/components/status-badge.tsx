import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

// Pale tint + dark ink of the same hue. Blue to call, amber retry, red lost, grey cancelled.
// The road to cash is the accent ladder: confirmed is the palest tint, shipped one step
// stronger, delivered the strongest with a tick.
export const PILL = {
  info: "bg-[var(--pill-info-bg)] text-[var(--pill-info-ink)]",
  warning: "bg-[var(--pill-warning-bg)] text-[var(--pill-warning-ink)]",
  positive: "bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]",
  negative: "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]",
  neutral: "bg-[var(--pill-neutral-bg)] text-[var(--pill-neutral-ink)]",
  soft: "bg-hue-soft text-hue-ink",
  track: "bg-hue-track text-hue-ink",
} as const;

const STYLES: Record<OrderStatus, string> = {
  NEW: PILL.info,
  NO_ANSWER: PILL.warning,
  CALLBACK: PILL.warning,
  CONFIRMED: PILL.soft,
  SHIPPED: PILL.track,
  DELIVERED: PILL.track,
  CANCELLED: PILL.neutral,
  RETURNED: PILL.negative,
};

export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 flex-none items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {status === "DELIVERED" && <Check aria-hidden className="size-3 text-data" strokeWidth={3} />}
      {label}
    </span>
  );
}
