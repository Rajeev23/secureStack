import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { formatMetricCount } from "@/lib/format-count";
import { withProjectImpact } from "@/services/intelligence/impact";
import { withInferredTier } from "@/services/intelligence/visibility";
import { recommendationKindFromComponent, sortAvailableUpdates, summarizeUpdateIntel } from "@/services/intelligence/summarize";
import { getCompanyContext } from "@/services/api/company";
import { listFindingHistoryForCompany, listOpenFindingsForCompany } from "@/services/api/findings";
import { listProjects } from "@/services/api/projects";
import { listLatestCompletedScansForProjects, listLatestScans, type ScanPublic } from "@/services/api/scans";

type ChangeAlert = {
  projectId: string;
  projectName: string;
  kind: string;
  severity: string;
  summary: string;
};

function collectChanges(
  scans: ScanPublic[],
  projects: Array<{ id: string; name: string }>,
  alertsEnabled: boolean,
): ChangeAlert[] {
  if (!alertsEnabled) return [];
  const latestByProject = new Map<string, ScanPublic>();
  for (const scan of scans) {
    if (scan.status !== "completed") continue;
    if (!latestByProject.has(scan.projectId)) latestByProject.set(scan.projectId, scan);
  }

  const alerts: ChangeAlert[] = [];
  for (const [projectId, scan] of latestByProject) {
    const projectName = projects.find((project) => project.id === projectId)?.name ?? "Project";
    for (const alert of scan.snapshot?.changes?.alerts ?? []) {
      alerts.push({
        projectId,
        projectName,
        kind: alert.kind,
        severity: alert.severity,
        summary: alert.summary,
      });
    }
  }
  return alerts.slice(0, 12);
}

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const projects = await listProjects(session.userId);
    const context = await getCompanyContext(session.userId);
    const [scans, findings, latestCompleted, history] = await Promise.all([
      listLatestScans(
        session.userId,
        projects.map((project) => project.id),
      ),
      listOpenFindingsForCompany(session.userId),
      listLatestCompletedScansForProjects(
        session.userId,
        projects.map((project) => project.id),
      ),
      listFindingHistoryForCompany(session.userId),
    ]);

    const inventory = [...latestCompleted.values()].flatMap((scan) => {
      const project = projects.find((item) => item.id === scan.projectId);
      return (scan.snapshot?.components ?? []).map((component) =>
        withInferredTier(
          withProjectImpact(
            {
              ...component,
              projectId: scan.projectId,
              projectName: project?.name ?? "Project",
            },
            {
              environment: project?.environment ?? "unknown",
              applicationName: project?.name ?? "Project",
            },
          ),
        ),
      );
    });
    const counts = summarizeUpdateIntel(inventory);
    const recentUpdates = sortAvailableUpdates(inventory).slice(0, 8).map((item) => ({
      ...item,
      recommendationKind: recommendationKindFromComponent(item),
    }));
    const hasScans = scans.some((scan) => scan.status === "completed");
    const priority = { P1: 0, P2: 0, P3: 0, P4: 0 };
    for (const item of sortAvailableUpdates(inventory)) {
      if (item.priority === "P1" || item.priority === "P2" || item.priority === "P3" || item.priority === "P4") {
        priority[item.priority] += 1;
      }
    }

    const weekAgo = Date.now() - 7 * 86_400_000;
    const resolved = history.filter((finding) => finding.status === "RESOLVED" && finding.resolvedAt);
    const resolvedLast7Days = resolved.filter(
      (finding) => Date.parse(finding.resolvedAt ?? "") >= weekAgo,
    ).length;
    const resolveHours = resolved
      .map((finding) => {
        const start = Date.parse(finding.firstDetectedAt);
        const end = Date.parse(finding.resolvedAt ?? "");
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
        return (end - start) / 3_600_000;
      })
      .filter((value): value is number => value != null);
    const meanTimeToResolveHours =
      resolveHours.length > 0
        ? Math.round(resolveHours.reduce((sum, value) => sum + value, 0) / resolveHours.length)
        : null;

    const recentScans = scans.slice(0, 8).map((scan) => {
      const project = projects.find((item) => item.id === scan.projectId);
      return {
        id: scan.id,
        projectId: scan.projectId,
        projectName: project?.name ?? "Project",
        source: scan.source,
        status: scan.status,
        completedAt: scan.completedAt,
        componentsFound: scan.componentsFound,
        findingsFound: scan.findingsFound,
      };
    });

    const trends = [...scans]
      .filter((scan) => scan.status === "completed")
      .slice(0, 10)
      .reverse()
      .map((scan) => ({
        at: scan.completedAt ?? scan.createdAt,
        findingsFound: scan.findingsFound,
        componentsFound: scan.componentsFound,
        projectName: projects.find((item) => item.id === scan.projectId)?.name ?? "Project",
      }));

    return NextResponse.json({
      stats: [
        {
          label: "Updates available",
          value: hasScans ? formatMetricCount(counts.updatesAvailable) : "—",
          change: hasScans ? "Newer upstream versions" : "Scan to compare current vs latest",
          trend: "neutral",
        },
        {
          label: "Security updates",
          value: hasScans ? formatMetricCount(counts.securityUpdates) : "—",
          change: hasScans ? "CVE or security fix in the new release" : "Scan to check advisories",
          trend: counts.securityUpdates > 0 ? "down" : "neutral",
        },
        {
          label: "P1 updates",
          value: hasScans ? formatMetricCount(counts.p1Updates) : "—",
          change: hasScans ? "Production security or overdue fixes" : "Scan to rank patches",
          trend: counts.p1Updates > 0 ? "down" : "neutral",
        },
        {
          label: "Review required",
          value: hasScans ? formatMetricCount(counts.reviewRequired) : "—",
          change: hasScans ? "Major or breaking changes" : "Scan to detect upgrade risk",
          trend: "neutral",
        },
        {
          label: "Auto-resolved (7d)",
          value: formatMetricCount(resolvedLast7Days),
          change:
            meanTimeToResolveHours != null
              ? `Mean time to close ${meanTimeToResolveHours}h`
              : "Findings close when the version is updated",
          trend: resolvedLast7Days > 0 ? "up" : "neutral",
        },
      ],
      projects,
      findings: findings.slice(0, 16),
      updates: recentUpdates,
      scans: recentScans,
      changes: collectChanges(
        [...latestCompleted.values()],
        projects,
        context.company?.alertsEnabled !== false,
      ),
      trends,
      priority,
      resolvedLast7Days,
      meanTimeToResolveHours,
    });
  } catch (error) {
    return jsonError(error);
  }
}
