import { Ban, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shown next to orders/customers. Renders nothing for normal customers. */
export function RiskBadge({
  risk,
  labels,
  className,
}: {
  risk: "blacklisted" | "risky" | "ok" | undefined;
  labels: { blacklisted: string; risky: string };
  className?: string;
}) {
  if (!risk || risk === "ok") return null;
  const Icon = risk === "blacklisted" ? Ban : TriangleAlert;
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        risk === "blacklisted"
          ? "bg-red-600 text-white dark:bg-red-500/80"
          : "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
        className,
      )}
    >
      <Icon className="size-3" />
      {labels[risk]}
    </span>
  );
}
