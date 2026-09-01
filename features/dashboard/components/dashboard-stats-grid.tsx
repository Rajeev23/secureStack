"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/features/dashboard/components/stat-card";
import type { DashboardStat } from "@/features/dashboard/types";

export function DashboardStatsGrid({ stats }: { stats: DashboardStat[] }) {
  if (!stats.length) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
