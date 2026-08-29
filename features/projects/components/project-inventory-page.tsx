"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DependencyTierChip, ImpactChip, PriorityChip } from "@/components/shared/issue-chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IntelligenceBadges } from "@/features/inventory/components/intelligence-badges";
import { TransitiveNote } from "@/features/inventory/components/transitive-note";
import { ProjectChrome } from "@/features/projects/components/project-chrome";
import { projectInventoryItemHref } from "@/features/projects/model";
import { fetchProjectComponents } from "@/features/scans/api/client";
import type { ScanComponent } from "@/features/scans/model";
import { useProjectComponents } from "@/features/scans/hooks/use-scans";

type ProjectInventoryPageProps = {
  projectId: string;
};

export function ProjectInventoryPage({ projectId }: ProjectInventoryPageProps) {
  const router = useRouter();
  const [includeTransitive, setIncludeTransitive] = useState(false);
  const componentsQuery = useProjectComponents(projectId, undefined, includeTransitive);
  const [moreComponents, setMoreComponents] = useState<{ key: string; items: ScanComponent[] }>({
    key: "",
    items: [],
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const pageComponents = componentsQuery.data?.components ?? [];
  const componentsKey = `${includeTransitive}:${componentsQuery.data?.scan?.id ?? ""}:${componentsQuery.data?.total ?? 0}`;
  const extraComponents = moreComponents.key === componentsKey ? moreComponents.items : [];
  const components = [...pageComponents, ...extraComponents];

  return (
    <ProjectChrome projectId={projectId} active="inventory">
      <div className="space-y-3">
        <TransitiveNote
          tiers={componentsQuery.data?.tiers}
          includeTransitive={includeTransitive}
          onToggle={setIncludeTransitive}
        />
        <p className="text-xs text-muted-foreground">
          Priority is P1–P4 (hover for why). Status is the action — Update urgently, Review required, Update
          recommended, or Up to date — plus known CVEs.
        </p>
        <div className="rounded-xl border bg-card">
          {componentsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : components.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No components yet. Start a scan to read dependency files and version pins from GitHub.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Open-source components discovered in this project</caption>
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Component</th>
                    <th className="px-4 py-2 font-medium">Tier</th>
                    <th className="px-4 py-2 font-medium">Current</th>
                    <th className="px-4 py-2 font-medium">Latest</th>
                    <th className="px-4 py-2 font-medium">Priority</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Impact</th>
                    <th className="px-4 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((component) => {
                    const href = projectInventoryItemHref(projectId, component.name);
                    return (
                      <tr
                        key={`${component.repository}:${component.ecosystem}:${component.name}:${component.sourceFile}`}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                        onClick={() => router.push(href)}
                      >
                        <td className="px-4 py-2 font-medium">
                          <Link href={href} className="hover:text-primary hover:underline">
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
                        <td className="px-4 py-2">
                          {component.impact && component.impact !== "none" ? (
                            <ImpactChip impact={component.impact} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {component.repository} / {component.sourceFile}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {componentsQuery.data?.hasMore || extraComponents.length > 0 ? (
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                  <p>
                    Showing {components.length}
                    {componentsQuery.data?.total != null ? ` of ${componentsQuery.data.total}` : ""}
                  </p>
                  {componentsQuery.data && components.length < componentsQuery.data.total ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingMore}
                      onClick={() => {
                        void (async () => {
                          setLoadingMore(true);
                          try {
                            const next = await fetchProjectComponents(projectId, {
                              offset: components.length,
                              limit: componentsQuery.data.limit,
                              includeTransitive,
                            });
                            setMoreComponents({
                              key: componentsKey,
                              items: [...extraComponents, ...next.components],
                            });
                          } finally {
                            setLoadingMore(false);
                          }
                        })();
                      }}
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </ProjectChrome>
  );
}
