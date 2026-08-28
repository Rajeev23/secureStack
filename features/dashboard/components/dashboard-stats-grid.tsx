"use client";

import { ErrorState } from "@/components/feedback/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";

export function DashboardStatsGrid() {
  const { data, isLoading, isError, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        role="status"
        aria-busy="true"
        aria-label="Loading dashboard stats"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <ErrorState
        title="Unable to load stats"
        description="Check the API route and try again."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {data.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
