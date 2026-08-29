"use client";

import Link from "next/link";
import { IntelligenceBadges } from "@/features/inventory/components/intelligence-badges";
import { PriorityChip } from "@/components/shared/issue-chip";
import type { ComponentDetail } from "@/features/inventory/components/component-detail-view";
import { projectInventoryItemHref } from "@/features/projects/model";

type UpdateFeedItem = ComponentDetail & {
  projectName?: string;
};

type TransitiveGroup = {
  parent: string;
  count: number;
  items: UpdateFeedItem[];
};

export function UpdateFeedList({
  items,
  groups = [],
  hrefFor,
  emptyTitle,
  emptyDescription,
}: {
  items: UpdateFeedItem[];
  groups?: TransitiveGroup[];
  hrefFor?: (item: UpdateFeedItem) => string | null;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0 && (!groups || groups.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => {
            const href =
              hrefFor?.(item) ??
              (item.projectId ? projectInventoryItemHref(item.projectId, item.name) : null);
            const body = (
              <>
                <span className="min-w-0">
                  <span className="font-medium">{item.name}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {item.version}
                    {item.latestVersion ? ` → ${item.latestVersion}` : ""}
                    {item.projectName ? ` · ${item.projectName}` : ""}
                    {item.environment ? ` · ${item.environment}` : ""}
                    {item.impact && item.impact !== "none" ? ` · ${item.impact} impact` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {item.priority ? (
                    <span title={item.priorityWhy ?? undefined}>
                      <PriorityChip priority={item.priority} />
                    </span>
                  ) : null}
                  <IntelligenceBadges
                    variant="table"
                    cves={item.cves}
                    versionStatus={item.versionStatus}
                    latestVersion={item.latestVersion}
                    eolStatus={item.eolStatus}
                    recommendationKind={item.recommendationKind}
                  />
                </span>
              </>
            );
            return (
              <li key={`${item.projectId ?? ""}:${item.ecosystem}:${item.name}:${item.sourceFile}`}>
                {href ? (
                  <Link
                    href={href}
                    className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex w-full flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {groups && groups.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <p className="border-b px-4 py-3 text-sm font-medium">Grouped transitive updates</p>
          <ul className="divide-y">
            {groups.map((group) => (
              <li key={group.parent} className="px-4 py-3 text-sm">
                <p className="font-medium">
                  {group.parent === "other" ? "Other transitives" : group.parent}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({group.count} transitive update{group.count === 1 ? "" : "s"})
                  </span>
                </p>
                {group.items.length ? (
                  <p className="mt-1 text-muted-foreground">
                    {group.items.map((item) => item.name).join(", ")}
                    {group.count > group.items.length ? "…" : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
