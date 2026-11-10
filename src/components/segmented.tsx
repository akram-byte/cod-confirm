"use client";

import { useCallback, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type SegmentItem = { key: string; label: string; href: string; count?: number };

/**
 * A segmented track whose white pill glides to the chosen option.
 * The pill moves on the click itself (before the server answers), so a tab never
 * feels dead; the new screen replaces the old one when it is ready.
 */
export function Segmented({
  items,
  value,
  label,
  full = false,
  className,
}: {
  items: SegmentItem[];
  value: string;
  label: string;
  /** Equal-width options across the whole row (tabs), instead of as wide as their words. */
  full?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const current = pending && chosen ? chosen : value;

  const track = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  const measure = useCallback(() => {
    const el = track.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(current)}"]`);
    setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [current]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <nav
      ref={track}
      aria-label={label}
      aria-busy={pending || undefined}
      className={cn("relative flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 [scrollbar-width:none]", !full && "w-fit max-w-full", className)}
    >
      {pill && (
        <span
          aria-hidden
          className="glide absolute top-1 bottom-1 left-0 rounded-md bg-card ring-1 ring-border"
          style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
        />
      )}
      {items.map((it) => {
        const on = it.key === current;
        return (
          <a
            key={it.key}
            data-key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              if (it.key === value && !pending) return;
              setChosen(it.key);
              startTransition(() => router.replace(it.href, { scroll: false }));
            }}
            onMouseEnter={() => router.prefetch(it.href)}
            className={cn(
              "relative z-[1] flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              full && "flex-1",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              // Before the first measure, the chosen option carries its own pill.
              on && !pill && "bg-card ring-1 ring-border",

            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className="rounded-full bg-muted-foreground/12 px-1.5 text-xs tabular-nums">{it.count}</span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
