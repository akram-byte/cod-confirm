import { cn } from "@/lib/utils";

export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad";
  /** The figure that answers the screen's question: larger and bold (money only). */
  lead?: boolean;
};

/**
 * One container split by 1px dividers: label over value, no icons, no tiles.
 * The column count follows the strip's own width (container query), not the window's,
 * so it never squeezes five figures beside an open sidebar. The dividers are the 1px
 * gaps between cells, so they are right for any number of rows.
 */
export function KpiStrip({ items, className }: { items: Kpi[]; className?: string }) {
  const odd = items.length % 2 === 1;
  return (
    <div className={cn("@container", className)}>
      <div
        className={cn(
          "grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border",
          items.length === 3 && "@xl:grid-cols-3",
          items.length === 4 && "@2xl:grid-cols-4",
          items.length >= 5 && "@4xl:grid-cols-5",
        )}
      >
        {items.map((k, i) => (
          <div
            key={k.label}
            className={cn(
              "min-w-0 bg-card px-5 py-4",
              // On two columns an odd last cell takes the full row instead of leaving a hole.
              odd && i === items.length - 1 && "col-span-2 @4xl:col-span-1",
              odd && items.length === 3 && i === items.length - 1 && "@xl:col-span-1",
            )}
          >
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p
              className={cn(
                "mt-1 whitespace-nowrap tabular-nums",
                k.lead ? "text-[30px] leading-9 font-bold" : "text-2xl leading-9 font-medium",
                k.tone === "good" && "text-positive",
                k.tone === "bad" && "text-negative",
              )}
            >
              {k.value}
            </p>
            {k.hint && <p className="mt-0.5 text-xs text-muted-foreground">{k.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
