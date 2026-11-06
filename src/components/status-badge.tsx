import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

// Pale tint + dark ink of the same hue. Hue = meaning: blue to call, amber retry,
// green done, red lost; neutral grey for states that need nothing from the seller.
export const PILL = {
  info: "bg-[var(--pill-info-bg)] text-[var(--pill-info-ink)]",
  warning: "bg-[var(--pill-warning-bg)] text-[var(--pill-warning-ink)]",
  positive: "bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]",
  negative: "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]",
  neutral: "bg-[var(--pill-neutral-bg)] text-[var(--pill-neutral-ink)]",
} as const;

const STYLES: Record<OrderStatus, string> = {
  NEW: PILL.info,
  NO_ANSWER: PILL.warning,
  CALLBACK: PILL.warning,
  CONFIRMED: PILL.neutral,
  SHIPPED: PILL.neutral,
  DELIVERED: PILL.positive,
  CANCELLED: PILL.neutral,
  RETURNED: PILL.negative,
};

export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 flex-none items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
