"use client";

import { useState } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TransitiveNote } from "@/features/inventory/components/transitive-note";
import { UpdateFeedList } from "@/features/updates/components/update-feed-list";
import { useAvailableUpdates } from "@/features/scans/hooks/use-scans";

export function UpdatesPage() {
  const [includeTransitive, setIncludeTransitive] = useState(false);
  const { data, isLoading, isError, refetch } = useAvailableUpdates(undefined, includeTransitive);
  const rows = data?.components ?? [];

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Updates"
        description="New upstream versions with a recommended action. Open a row for current → new, what changed, and findings."
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load updates"
          description="Scan a project first, then try again."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <>
          <TransitiveNote
            tiers={data?.tiers}
            includeTransitive={includeTransitive}
            onToggle={setIncludeTransitive}
          />
          <UpdateFeedList
            items={rows}
            groups={includeTransitive ? [] : data?.transitiveGroups}
            emptyTitle="No updates waiting"
            emptyDescription="Scan a connected repository. Components already on the latest version stay off this list."
          />
        </>
      )}
    </div>
  );
}
