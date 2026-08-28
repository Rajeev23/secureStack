"use client";

import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { FindingsTable } from "@/features/findings/components/findings-table";
import { useCompanyFindings } from "@/features/findings/hooks/use-findings";

export function FindingsPage() {
  const { data, isLoading, isError, refetch } = useCompanyFindings();
  const open = (data ?? []).filter((finding) => finding.status !== "RESOLVED");

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Findings"
        description="Security advisories, outdated packages, and end-of-life software. Findings auto-close when the installed version is updated."
      />

      {isError ? (
        <ErrorState
          title="Unable to load findings"
          description="Scan a project first, then try again."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <FindingsTable findings={open} isLoading={isLoading} showProject />
      )}
    </div>
  );
}
