"use client";

import { formatDistanceToNow } from "date-fns";
import { ChangeKindChip, ScanStatusChip, SeverityChip } from "@/components/shared/issue-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectChrome } from "@/features/projects/components/project-chrome";
import { useProjectComponents, useProjectScans } from "@/features/scans/hooks/use-scans";
import { scanSourceLabel } from "@/lib/scan-source";

type ProjectScansPageProps = {
  projectId: string;
};

export function ProjectScansPage({ projectId }: ProjectScansPageProps) {
  const scansQuery = useProjectScans(projectId);
  const componentsQuery = useProjectComponents(projectId);
  const changes = componentsQuery.data?.changes;

  return (
    <ProjectChrome projectId={projectId} active="scans">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="font-medium">Since last scan</p>
          {!changes ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Scan again to compare this inventory with the previous scan.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-muted-foreground">
                {changes.added.length} added · {changes.removed.length} removed · {changes.updated.length} version
                changes · {changes.newCves.length} new CVEs
              </p>
              {changes.alerts.length ? (
                <ul className="divide-y rounded-lg border">
                  {changes.alerts.map((alert, index) => (
                    <li key={`${alert.summary}:${index}`} className="flex items-start justify-between gap-3 px-3 py-2">
                      <span className="min-w-0 font-medium">{alert.summary}</span>
                      <span className="flex shrink-0 flex-wrap justify-end gap-1">
                        <ChangeKindChip kind={alert.kind} />
                        <SeverityChip severity={alert.severity} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No security or lifecycle alerts between scans.</p>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl border bg-card">
          {scansQuery.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : scansQuery.data?.length ? (
            <ul className="divide-y">
              {scansQuery.data.map((scan) => (
                <li key={scan.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{scanSourceLabel(scan.source)} scan</p>
                    <p className="text-muted-foreground">
                      {scan.completedAt
                        ? formatDistanceToNow(new Date(scan.completedAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                      {scan.status === "completed" ? ` · ${scan.findingsFound} findings` : null}
                      {scan.error ? ` · ${scan.error}` : null}
                    </p>
                  </div>
                  <ScanStatusChip status={scan.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">No scans yet.</p>
          )}
        </div>
      </div>
    </ProjectChrome>
  );
}
