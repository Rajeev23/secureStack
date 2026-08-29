"use client";

import Link from "next/link";
import type { Finding } from "@/features/findings/model";
import { FindingSeverityBadge, FindingTypeBadge } from "@/features/findings/components/finding-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { FINDING_STATUS_PALETTE, lookupPalette } from "@/config/issue-palette";
import { projectInventoryItemHref, projectOverviewHref } from "@/features/projects/model";

type FindingsTableProps = {
  findings: Finding[];
  isLoading?: boolean;
  showProject?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function FindingsTable({
  findings,
  isLoading = false,
  showProject = false,
  emptyTitle = "No findings",
  emptyDescription = "Start a scan to match CVEs, outdated packages, and end-of-life software.",
}: FindingsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Open-source findings</caption>
        <thead className="border-b bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Component</th>
            <th className="px-4 py-2 font-medium">Issue</th>
            <th className="px-4 py-2 font-medium">Severity</th>
            <th className="px-4 py-2 font-medium">Current</th>
            <th className="px-4 py-2 font-medium">Upgrade to</th>
            {showProject ? <th className="px-4 py-2 font-medium">Project</th> : null}
            <th className="px-4 py-2 font-medium">Recommendation</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => {
            const statusPalette = lookupPalette(FINDING_STATUS_PALETTE, finding.status);
            return (
              <tr key={finding.id} className="border-b last:border-0 align-top">
                <td className="px-4 py-2 font-medium">
                  <Link
                    href={projectInventoryItemHref(finding.projectId, finding.componentName)}
                    className="hover:text-primary hover:underline"
                  >
                    {finding.componentName}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col gap-1">
                    <FindingTypeBadge type={finding.findingType} />
                    {finding.externalReference ? (
                      <span className="text-xs text-muted-foreground">{finding.externalReference}</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <FindingSeverityBadge severity={finding.severity} />
                </td>
                <td className="px-4 py-2 tabular-nums">{finding.currentVersion ?? "—"}</td>
                <td className="px-4 py-2 tabular-nums">{finding.recommendedVersion ?? "—"}</td>
                {showProject ? (
                  <td className="px-4 py-2">
                    <Link href={projectOverviewHref(finding.projectId)} className="text-primary hover:underline">
                      {finding.projectName ?? "Project"}
                    </Link>
                  </td>
                ) : null}
                <td className="px-4 py-2 text-muted-foreground">{finding.recommendation}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: statusPalette.color }}
                      aria-hidden
                    />
                    {statusPalette.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
