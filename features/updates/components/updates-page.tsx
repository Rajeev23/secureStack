"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TransitiveNote } from "@/features/inventory/components/transitive-note";
import { UpdateFeedList } from "@/features/updates/components/update-feed-list";
import { paginatedInventoryFromSession, sessionInventoryHref } from "@/features/scan-session/lib/derive";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function UpdatesPage() {
  const { scan, hydrated } = useHydratedScanSession();
  const [includeTransitive, setIncludeTransitive] = useState(false);
  const page = scan
    ? paginatedInventoryFromSession(scan, {
        includeTransitive,
        outdatedOnly: true,
        offset: 0,
        limit: DEFAULT_PAGE_SIZE,
      })
    : null;

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Updates"
        description="New upstream versions with a recommended action. Open a row for current → new, what changed, and findings."
        actions={
          <Button render={<Link href="/scan" />} variant="outline" size="sm">
            New scan
          </Button>
        }
      />

      {!hydrated ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <>
          {scan ? (
            <TransitiveNote
              tiers={page?.tiers}
              includeTransitive={includeTransitive}
              onToggle={setIncludeTransitive}
            />
          ) : null}
          <UpdateFeedList
            items={page?.components ?? []}
            groups={includeTransitive ? [] : page?.transitiveGroups}
            hrefFor={(item) => sessionInventoryHref(item.name)}
            emptyTitle="No updates waiting"
            emptyDescription="Scan GitHub or upload a file. Components already on the latest version stay off this list."
          />
        </>
      )}
    </div>
  );
}
