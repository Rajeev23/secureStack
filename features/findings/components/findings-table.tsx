"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { Finding } from "@/features/findings/model";
import { FindingSeverityBadge, FindingTypeBadge } from "@/features/findings/components/finding-badges";
import { useUpdateFindingStatus } from "@/features/findings/hooks/use-findings";
import { Skeleton } from "@/components/ui/skeleton";
import { FINDING_STATUS_PALETTE, lookupPalette } from "@/config/issue-palette";
import { ApiError } from "@/lib/api/errors";

type FindingsTableProps = {
  findings: Finding[];
  isLoading?: boolean;
  showProject?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

const STATUSES: Finding["status"][] = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "IGNORED",
  "ACCEPTED_RISK",
];

function statusLabel(status: Finding["status"]): string {
  return lookupPalette(FINDING_STATUS_PALETTE, status).label;
}

export function FindingsTable({
  findings,
  isLoading = false,
  showProject = false,
  emptyTitle = "No findings",
  emptyDescription = "Start a scan to match CVEs, outdated packages, and end-of-life software.",
}: FindingsTableProps) {
  const updateStatus = useUpdateFindingStatus();

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
              <td className="px-4 py-2 font-medium">{finding.componentName}</td>
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
                  <Link href={`/projects/${finding.projectId}`} className="text-primary hover:underline">
                    {finding.projectName ?? "Project"}
                  </Link>
                </td>
              ) : null}
              <td className="px-4 py-2 text-muted-foreground">{finding.recommendation}</td>
              <td className="px-4 py-2">
                <label className="sr-only" htmlFor={`finding-status-${finding.id}`}>
                  Status for {finding.componentName}
                </label>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: statusPalette.color }}
                    aria-hidden
                  />
                  <select
                    id={`finding-status-${finding.id}`}
                    className="max-w-40 rounded-md border bg-background px-2 py-1 text-xs"
                    style={{ borderColor: statusPalette.color }}
                    value={finding.status}
                    disabled={updateStatus.isPending}
                    onChange={(event) => {
                      void updateStatus
                        .mutateAsync({
                          findingId: finding.id,
                          status: event.target.value as Finding["status"],
                        })
                        .then(() => toast.success("Finding updated."))
                        .catch((error) => {
                          toast.error(error instanceof ApiError ? error.message : "Unable to update finding.");
                        });
                    }}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
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
