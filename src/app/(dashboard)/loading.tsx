import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly while a dashboard page loads its data.
export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className={i === 4 ? "col-span-2 h-24 rounded-xl lg:col-span-1" : "h-24 rounded-xl"} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
