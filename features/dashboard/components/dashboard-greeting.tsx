"use client";

import { getDashboardGreeting } from "@/features/dashboard/lib/greeting";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardGreeting() {
  const { scan, hydrated } = useHydratedScanSession();
  const greeting = getDashboardGreeting();

  if (!hydrated) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-56 max-w-full" aria-hidden />
        <Skeleton className="h-4 w-72 max-w-full" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {greeting}
      </h1>
      <p className="text-page-description">
        {scan
          ? `Update intelligence for ${scan.label}. This report is only in your browser.`
          : "Patch and dependency update intelligence. No account. Nothing stored."}
      </p>
    </div>
  );
}
