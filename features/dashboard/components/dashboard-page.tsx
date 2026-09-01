"use client";

import Link from "next/link";
import { ScanSearch } from "lucide-react";
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
import { dashboardFromSession, sessionInventoryHref } from "@/features/scan-session/lib/derive";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";
import { scanSourceLabel } from "@/lib/scan-source";
import { formatDistanceToNow } from "date-fns";

function ScanButton({ label = "Scan a repository" }: { label?: string }) {
  return (
    <Button render={<Link href="/scan" />}>
      <ScanSearch className="size-4" aria-hidden />
      {label}
    </Button>
  );
}

export function DashboardPage() {
  const { scan, hydrated } = useHydratedScanSession();
  const data = dashboardFromSession(scan);
  const recentUpdates = data.updates.slice(0, 8);
  const priority = data.priority ?? { P1: 0, P2: 0, P3: 0, P4: 0 };

  if (!hydrated) {
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

  if (!scan) {
    return (
      <div className="dashboard-page animate-fade-in gap-4">
        <DashboardGreeting />
        <EmptyState
          icon={ScanSearch}
          title="Scan to see what to update"
          description="Connect GitHub or upload an SBOM / manifest. The report stays in this tab. We do not create accounts or store your data."
          action={<ScanButton />}
          className="min-h-80 bg-card"
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardGreeting />
        <ScanButton label="New scan" />
      </div>

      <section className="space-y-3">
        <DashboardStatsGrid stats={data.stats} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Priority mix" description="P1 is production security or overdue fixes.">
          <ul className="grid grid-cols-4 gap-2 text-center text-sm">
            {(["P1", "P2", "P3", "P4"] as const).map((key) => (
              <li key={key} className="rounded-lg border bg-muted/30 px-2 py-3">
                <p className="text-muted-foreground">{key}</p>
                <p className="font-heading text-xl font-semibold tabular-nums">{priority[key]}</p>
              </li>
            ))}
          </ul>
        </DashboardPanel>
        <DashboardPanel title="This scan" description="Results live in this browser tab until you close it or start a new scan.">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-2">
              <span className="text-muted-foreground">Source</span>
              <span>{scanSourceLabel(scan.source)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted-foreground">Target</span>
              <span className="truncate font-medium">{scan.label}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted-foreground">Packages</span>
              <span className="tabular-nums">{scan.componentsFound}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted-foreground">Findings</span>
              <span className="tabular-nums">{scan.findingsFound}</span>
            </li>
          </ul>
        </DashboardPanel>
      </div>

      {data.changes.length ? (
        <DashboardPanel title="What’s changed" description="Security and lifecycle alerts from this scan.">
          <ul className="divide-y">
            {data.changes.map((alert, index) => (
              <DashboardFeedRow
                key={`${alert.summary}:${index}`}
                href="/inventory"
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

      <DashboardPanel title="Recent updates" description="New upstream versions with a recommended action.">
        {recentUpdates.length ? (
          <ul className="divide-y">
            {recentUpdates.map((item) => (
              <DashboardFeedRow
                key={`${item.ecosystem}:${item.name}:${item.sourceFile}`}
                href={sessionInventoryHref(item.name)}
                title={item.name}
                subtitle={`${item.version}${item.latestVersion ? ` → ${item.latestVersion}` : ""}${item.priority ? ` · ${item.priority}` : ""}`}
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
          <p className="text-sm text-muted-foreground">No available updates in this scan.</p>
        )}
      </DashboardPanel>

      <DashboardPanel title="Open findings" description="Security, update, and EOL issues from this scan.">
        {data.findings.length ? (
          <ul className="divide-y">
            {data.findings.slice(0, 8).map((finding) => (
              <DashboardFeedRow
                key={finding.id}
                href={sessionInventoryHref(finding.componentName)}
                title={finding.componentName}
                subtitle={`${finding.currentVersion ?? ""}${finding.recommendedVersion ? ` → ${finding.recommendedVersion}` : ""}`}
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
          <p className="text-sm text-muted-foreground">No open findings on this scan.</p>
        )}
      </DashboardPanel>

      <DashboardPanel title="Scan" description="This run is not saved on a server.">
        {data.scans.map((item) => {
          const when = item.completedAt;
          return (
            <DashboardFeedRow
              key={item.id}
              href="/inventory"
              title={item.projectName}
              subtitle={
                when
                  ? `${scanSourceLabel(item.source ?? "github")} · ${item.findingsFound ?? 0} findings · ${formatDistanceToNow(new Date(when), { addSuffix: true })}`
                  : scanSourceLabel(item.source ?? "github")
              }
              chips={<ScanStatusChip status={item.status} />}
            />
          );
        })}
      </DashboardPanel>
    </div>
  );
}
