import { cn } from "@/lib/utils";

/** COD Confirm's mark: a parcel seen from the front, with a tick on it. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--data)" />
      <path d="M9 11.5 16 8l7 3.5v9L16 24l-7-3.5z" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m12.5 15.6 2.6 2.6 4.6-4.9" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
