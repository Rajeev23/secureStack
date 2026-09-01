"use client";

import { useState } from "react";
import Link from "next/link";
import { DependencyTierChip, PriorityChip } from "@/components/shared/issue-chip";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { IntelligenceBadges } from "@/features/inventory/components/intelligence-badges";
import { TransitiveNote } from "@/features/inventory/components/transitive-note";
import { paginatedInventoryFromSession, sessionInventoryHref } from "@/features/scan-session/lib/derive";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function InventoryPage() {
  const { scan, hydrated } = useHydratedScanSession();
  const [includeTransitive, setIncludeTransitive] = useState(false);
  const [visible, setVisible] = useState(DEFAULT_PAGE_SIZE);

  const page = scan
    ? paginatedInventoryFromSession(scan, {
        includeTransitive,
        offset: 0,
        limit: visible,
      })
    : null;
  const components = page?.components ?? [];

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Report"
        description="Infrastructure pins and declared dependencies. Open a package for current → new, what changed, and findings."
        actions={
          <Button render={<Link href="/scan" />} variant="outline" size="sm">
            New scan
          </Button>
        }
      />

      {hydrated && scan ? (
        <TransitiveNote
          tiers={page?.tiers}
          includeTransitive={includeTransitive}
          onToggle={(next) => {
            setIncludeTransitive(next);
            setVisible(DEFAULT_PAGE_SIZE);
          }}
        />
      ) : null}

      {!hydrated ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : components.length ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Component inventory</caption>
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Component</th>
                <th className="px-4 py-2 font-medium">Tier</th>
                <th className="px-4 py-2 font-medium">Current</th>
                <th className="px-4 py-2 font-medium">Latest</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {components.map((component) => (
                <tr
                  key={`${component.repository}:${component.ecosystem}:${component.name}:${component.sourceFile}`}
                  className="border-b last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-2 font-medium">
                    <Link href={sessionInventoryHref(component.name)} className="hover:text-primary hover:underline">
                      {component.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {component.tier ? <DependencyTierChip tier={component.tier} /> : "—"}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{component.version}</td>
                  <td className="px-4 py-2 tabular-nums">{component.latestVersion ?? "—"}</td>
                  <td className="px-4 py-2">
                    {component.priority ? (
                      <span title={component.priorityWhy ?? undefined}>
                        <PriorityChip priority={component.priority} />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <IntelligenceBadges
                      variant="table"
                      cves={component.cves}
                      versionStatus={component.versionStatus}
                      latestVersion={component.latestVersion}
                      eolStatus={component.eolStatus}
                      recommendationKind={component.recommendationKind}
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{component.sourceFile}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {page && components.length < page.total ? (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <p>
                Showing {components.length} of {page.total}
              </p>
              <Button variant="outline" size="sm" onClick={() => setVisible((count) => count + DEFAULT_PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">No inventory yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/scan" className="text-primary hover:underline">
              Scan GitHub or upload a file
            </Link>{" "}
            to discover open-source components.
          </p>
        </div>
      )}
    </div>
  );
}
