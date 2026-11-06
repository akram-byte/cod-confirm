import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

const STYLES: Record<OrderStatus, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  NO_ANSWER: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  CALLBACK: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  CANCELLED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  DELIVERED: "bg-green-600 text-white dark:bg-green-500/80",
  RETURNED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
