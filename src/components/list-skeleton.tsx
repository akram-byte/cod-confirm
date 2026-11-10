import { Skeleton } from "@/components/ui/skeleton";

/** A list screen while it loads: the final layout with flat grey bars at their real sizes. */
export function ListSkeleton({ tabs = false, rows = 8 }: { tabs?: boolean; rows?: number }) {
  return (
    <div aria-busy="true">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />
      {tabs ? <Skeleton className="mt-6 h-10 w-full rounded-lg" /> : <Skeleton className="mt-6 h-9 w-full max-w-xl rounded-lg" />}
      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-rule px-4 py-3.5 first:border-t-0">
            <Skeleton className="h-4 w-12" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
