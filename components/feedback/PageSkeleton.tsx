import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div
      className="dashboard-page"
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
