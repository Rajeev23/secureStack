"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectProjectPage } from "@/features/projects/components/connect-project-page";

export function ConnectProjectPageWithSuspense({ projectId }: { projectId: string }) {
  return (
    <Suspense
      fallback={
        <div className="dashboard-page mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ConnectProjectPage projectId={projectId} />
    </Suspense>
  );
}
