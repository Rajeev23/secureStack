"use client";

import { getDisplayUser, useUserStore } from "@/features/auth";
import { useIsClient } from "@/hooks/use-is-client";
import { getDashboardGreeting, getGreetingFirstName } from "@/features/dashboard/lib/greeting";
import { useCompanyContextStore } from "@/stores/company-context-store";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardGreeting() {
  const mounted = useIsClient();
  const rawUser = useUserStore((state) => state.user);
  const status = useUserStore((state) => state.status);
  const company = useCompanyContextStore((state) => state.company);
  const companyStatus = useCompanyContextStore((state) => state.status);
  const firstName = getGreetingFirstName(getDisplayUser(rawUser).name);
  const greeting = getDashboardGreeting();
  const scopeName = company?.name ?? "your company";
  const contextPending = companyStatus === "idle" || companyStatus === "loading";

  if (!mounted || status === "loading") {
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
        {firstName ? (
          <>
            {greeting}, <span className="text-primary">{firstName}</span>
          </>
        ) : (
          greeting
        )}
      </h1>
      {contextPending ? (
        <Skeleton className="h-4 w-72 max-w-full" aria-hidden />
      ) : (
        <p className="text-page-description">Patch and dependency update intelligence for {scopeName}</p>
      )}
    </div>
  );
}
