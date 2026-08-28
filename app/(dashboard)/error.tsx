"use client";

import { ErrorState } from "@/components/feedback/ErrorState";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="dashboard-page">
      <ErrorState
        headingLevel="h1"
        title="Page error"
        description={error.message}
        onRetry={reset}
      />
    </div>
  );
}
