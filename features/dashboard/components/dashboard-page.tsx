"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FolderKanban, Plus } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  ChangeKindChip,
  FindingTypeChip,
  RecommendationKindChip,
  ScanStatusChip,
  SeverityChip,
  VersionStatusChip,
} from "@/components/shared/issue-chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFeedRow } from "@/features/dashboard/components/dashboard-feed-row";
import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DashboardStatsGrid } from "@/features/dashboard/components/dashboard-stats-grid";
import { useDashboardOverview } from "@/features/dashboard/hooks/use-dashboard-stats";
import { SCAN_STATUS_PALETTE, lookupPalette } from "@/config/issue-palette";
import { scanSourceLabel } from "@/lib/scan-source";

function AddProjectButton() {
  return (
    <Button render={<Link href="/projects/new" />}>
      <Plus className="size-4" aria-hidden />
      Add Project
    </Button>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboardOverview();
  const recentUpdates = (data?.updates ?? []).slice(0, 8);
  const trends = data?.trends ?? [];
  const priority = data?.priority ?? { P1: 0, P2: 0, P3: 0, P4: 0 };
  const maxTrend = Math.max(1, ...trends.map((point) => point.findingsFound));

  if (isLoading) {
    return (
      <div className="dashboard-page animate-fade-in gap-4">
        <DashboardGreeting />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data?.projects.length) {
    return (
      <div className="dashboard-page animate-fade-in gap-4">
        <DashboardGreeting />
        <EmptyState
          icon={FolderKanban}
          title="Add your first project"
          description="Connect a GitHub repository so SecureStack can watch open-source versions, explain what changed, and recommend updates."
          action={<AddProjectButton />}
          className="min-h-80 bg-card"
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardGreeting />
        <AddProjectButton />
      </div>

      <section className="space-y-3">
        <DashboardStatsGrid />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel
          title="Open updates over time"
          description="Findings counted on each completed scan. New upstream releases appear after the scheduled scan (within 24 hours by default)."
        >
          {trends.length ? (
            <ol className="space-y-2">
              {trends.map((point) => (
                <li key={`${point.at}:${point.projectName}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{point.projectName}</span>
                    <span className="tabular-nums">{point.findingsFound}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(8, (point.findingsFound / maxTrend) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Scan a project to start the trend line.</p>
          )}
        </DashboardPanel>
        <DashboardPanel title="Priority mix" description="P1 is production security or overdue fixes. Hover a P1 chip on Updates for why.">
          <ul className="grid grid-cols-4 gap-2 text-center text-sm">
            {(["P1", "P2", "P3", "P4"] as const).map((key) => (
              <li key={key} className="rounded-lg border bg-muted/30 px-2 py-3">
                <p className="text-muted-foreground">{key}</p>
                <p className="font-heading text-xl font-semibold tabular-nums">{priority[key]}</p>
              </li>
            ))}
          </ul>
        </DashboardPanel>
      </div>

      {data.changes.length ? (
        <DashboardPanel title="What’s changed alerts" description="Security and lifecycle alerts from the latest scans.">
          <ul className="divide-y">
            {data.changes.map((alert, index) => (
              <DashboardFeedRow
                key={`${alert.projectId}:${alert.summary}:${index}`}
                href={`/projects/${alert.projectId}`}
                title={alert.summary}
                subtitle={alert.projectName}
                chips={
                  <>
                    <ChangeKindChip kind={alert.kind} />
                    <SeverityChip severity={alert.severity} />
                  </>
                }
              />
            ))}
          </ul>
        </DashboardPanel>
      ) : null}

      <DashboardPanel
        title="Recent updates"
        description="New upstream versions with a recommended action. Open a project for what changed."
      >
        {recentUpdates.length ? (
          <ul className="divide-y">
            {recentUpdates.map((item) => (
              <DashboardFeedRow
                key={`${item.projectId}:${item.ecosystem}:${item.name}:${item.sourceFile}`}
                href={`/projects/${item.projectId}`}
                title={item.name}
                subtitle={`${item.version}${item.latestVersion ? ` → ${item.latestVersion}` : ""} · ${item.projectName}${item.priority ? ` · ${item.priority}` : ""}`}
                chips={
                  <>
                    {item.recommendationKind ? (
                      <RecommendationKindChip kind={item.recommendationKind} />
                    ) : null}
                    {item.versionStatus ? <VersionStatusChip status={item.versionStatus} /> : null}
                  </>
                }
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No available updates yet. Scan a connected repository to compare current versions with upstream
            releases.
          </p>
        )}
      </DashboardPanel>

      <DashboardPanel title="Open findings" description="Security, update, and EOL findings that are still open.">
        {data.findings.length ? (
          <ul className="divide-y">
            {data.findings.slice(0, 8).map((finding) => (
              <DashboardFeedRow
                key={finding.id}
                href={`/projects/${finding.projectId}`}
                title={finding.componentName}
                subtitle={`${finding.projectName ?? "Project"}${finding.currentVersion ? ` · ${finding.currentVersion}` : ""}${finding.recommendedVersion ? ` → ${finding.recommendedVersion}` : ""}`}
                chips={
                  <>
                    <FindingTypeChip type={finding.findingType} />
                    <SeverityChip severity={finding.severity} />
                  </>
                }
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No open findings. Findings auto-close when the version is updated.</p>
        )}
      </DashboardPanel>

      <DashboardPanel title="Recent scans" description="Latest run per project, including scheduled and SBOM imports.">
        {data.scans.length ? (
          <ul className="divide-y">
            {data.scans.map((scan) => {
              const when = scan.completedAt ?? null;
              const findingsLabel =
                scan.status === "completed"
                  ? `${scan.findingsFound ?? 0} finding${scan.findingsFound === 1 ? "" : "s"}`
                  : lookupPalette(SCAN_STATUS_PALETTE, scan.status).label;
              return (
                <DashboardFeedRow
                  key={scan.id}
                  href={`/projects/${scan.projectId}`}
                  title={scan.projectName}
                  subtitle={
                    when
                      ? `${scanSourceLabel(scan.source ?? "github")} · ${findingsLabel} · ${formatDistanceToNow(new Date(when), { addSuffix: true })}`
                      : `${scanSourceLabel(scan.source ?? "github")} · ${findingsLabel}`
                  }
                  chips={<ScanStatusChip status={scan.status} />}
                />
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No scans yet. Open a project and start a scan.</p>
        )}
      </DashboardPanel>
    </div>
  );
}
