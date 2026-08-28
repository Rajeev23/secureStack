"use client";

import { useState } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/feedback/ErrorState";
import { DependencyTierChip, EnvironmentChip } from "@/components/shared/issue-chip";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ComponentDetailDialog, type ComponentDetail } from "@/features/inventory/components/component-detail-dialog";
import { IntelligenceBadges } from "@/features/inventory/components/intelligence-badges";
import { TransitiveNote } from "@/features/inventory/components/transitive-note";
import { fetchInventory, type InventoryComponent } from "@/features/scans/api/client";
import { useInventory } from "@/features/scans/hooks/use-scans";

export function InventoryPage() {
  const [includeTransitive, setIncludeTransitive] = useState(false);
  const { data, isLoading, isError, refetch } = useInventory(undefined, includeTransitive);
  const [selected, setSelected] = useState<ComponentDetail | null>(null);
  const [more, setMore] = useState<{ key: string; items: InventoryComponent[] }>({ key: "", items: [] });
  const [loadingMore, setLoadingMore] = useState(false);

  const pageKey = data
    ? `${includeTransitive}:${data.total}:${data.offset}:${data.components[0]?.scanId ?? ""}`
    : "";
  const extra = more.key === pageKey ? more.items : [];
  const components = [...(data?.components ?? []), ...extra];
  const hasMore = Boolean(data && components.length < data.total);

  const onLoadMore = async () => {
    if (!data) return;
    setLoadingMore(true);
    try {
      const next = await fetchInventory({
        offset: components.length,
        limit: data.limit,
        includeTransitive,
      });
      setMore({ key: pageKey, items: [...extra, ...next.components] });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Inventory"
        description="Infrastructure pins and declared dependencies. Click a row for current → new, what changed, and the recommendation."
      />

      <TransitiveNote
        tiers={data?.tiers}
        includeTransitive={includeTransitive}
        onToggle={setIncludeTransitive}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load inventory"
          description="Scan a project first, then try again."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : components.length ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Company component inventory</caption>
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Component</th>
                <th className="px-4 py-2 font-medium">Tier</th>
                <th className="px-4 py-2 font-medium">Current</th>
                <th className="px-4 py-2 font-medium">Latest</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Env</th>
                <th className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
                    {components.map((component) => (
                      <tr
                        key={`${component.projectId}:${component.repository}:${component.ecosystem}:${component.name}:${component.sourceFile}`}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                        onClick={() => setSelected(component)}
                      >
                        <td className="px-4 py-2 font-medium">{component.name}</td>
                  <td className="px-4 py-2">
                    {component.tier ? <DependencyTierChip tier={component.tier} /> : "—"}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{component.version}</td>
                  <td className="px-4 py-2 tabular-nums">{component.latestVersion ?? "—"}</td>
                  <td className="px-4 py-2">
                    <IntelligenceBadges
                      cves={component.cves}
                      versionStatus={component.versionStatus}
                      latestVersion={component.latestVersion}
                      eolStatus={component.eolStatus}
                      recommendationKind={component.recommendationKind}
                      priority={component.priority}
                      priorityWhy={component.priorityWhy}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/projects/${component.projectId}`}
                      className="text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {component.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {component.environment ? <EnvironmentChip environment={component.environment} /> : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{component.sourceFile}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore ? (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <p>
                Showing {components.length} of {data?.total}
              </p>
              <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void onLoadMore()}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : data && data.total > data.limit ? (
            <p className="border-t px-4 py-3 text-sm text-muted-foreground">
              Showing {components.length} of {data.total}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">No inventory yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a GitHub repository and start a scan to discover open-source components.
          </p>
        </div>
      )}

      <ComponentDetailDialog component={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
