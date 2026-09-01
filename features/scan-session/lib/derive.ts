import type { EnrichedComponent } from "@/services/intelligence/types";
import type { IntelligenceFindingDraft } from "@/services/intelligence/types";
import type { SessionScanResult } from "@/services/session-scan/types";
import type { Finding } from "@/features/findings/model";
import type { DashboardOverviewResponse, DashboardStat } from "@/features/dashboard/types";
import {
  filterInventoryRows,
  inventoryMeta,
} from "@/services/intelligence/inventory-query";
import {
  sortAvailableUpdates,
  summarizeUpdateIntel,
} from "@/services/intelligence/summarize";
import { formatMetricCount } from "@/lib/format-count";
import { findingIdentity } from "@/services/intelligence/identity";
import { paginate } from "@/lib/pagination";

export function sessionInventoryHref(name: string): string {
  const slug = name.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `/inventory/${slug}`;
}

export function sessionInventoryNameFromSegments(segments: string[]): string {
  return segments.map((part) => decodeURIComponent(part)).join("/");
}

export function findingsFromSession(scan: SessionScanResult): Finding[] {
  return scan.findings.map((draft: IntelligenceFindingDraft) => {
    const id = findingIdentity({
      componentName: draft.componentName,
      ecosystem: draft.ecosystem,
      findingType: draft.findingType,
      externalReference: draft.externalReference,
    });
    return {
      id,
      projectId: scan.id,
      projectName: scan.label,
      componentName: draft.componentName,
      ecosystem: draft.ecosystem,
      currentVersion: draft.currentVersion,
      recommendedVersion: draft.recommendedVersion,
      findingType: draft.findingType,
      severity: draft.severity,
      externalReference: draft.externalReference,
      status: "OPEN" as const,
      recommendation: draft.recommendation,
      firstDetectedAt: scan.scannedAt,
      lastDetectedAt: scan.scannedAt,
      resolvedAt: null,
      createdAt: scan.scannedAt,
      updatedAt: scan.scannedAt,
    };
  });
}

export function inventoryRowsFromSession(
  scan: SessionScanResult,
  includeTransitive: boolean,
  outdatedOnly = false,
) {
  const all = scan.snapshot.components;
  const visible = filterInventoryRows(all, includeTransitive);
  const rows = outdatedOnly ? sortAvailableUpdates(visible) : visible;
  const meta = inventoryMeta(all);
  return { rows, meta, all };
}

export function paginatedInventoryFromSession(
  scan: SessionScanResult,
  options: { includeTransitive: boolean; outdatedOnly?: boolean; offset?: number; limit?: number; name?: string },
) {
  if (options.name) {
    const needle = options.name.trim().toLowerCase();
    const rows = scan.snapshot.components.filter((row) => row.name.toLowerCase() === needle);
    return {
      components: rows,
      total: rows.length,
      offset: 0,
      limit: rows.length,
      tiers: inventoryMeta(scan.snapshot.components).tiers,
      transitiveGroups: options.includeTransitive
        ? []
        : inventoryMeta(scan.snapshot.components).transitiveGroups,
    };
  }

  const { rows, meta } = inventoryRowsFromSession(
    scan,
    options.includeTransitive,
    options.outdatedOnly,
  );
  const page = paginate(rows, options.offset ?? 0, options.limit ?? 100);
  return {
    components: page.items,
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    tiers: meta.tiers,
    transitiveGroups: options.includeTransitive ? [] : meta.transitiveGroups,
  };
}

export function findSessionComponent(
  scan: SessionScanResult,
  name: string,
): EnrichedComponent | null {
  const needle = name.trim().toLowerCase();
  return scan.snapshot.components.find((row) => row.name.toLowerCase() === needle) ?? null;
}

function statsFromScan(scan: SessionScanResult): DashboardStat[] {
  const counts = summarizeUpdateIntel(scan.snapshot.components);
  return [
    {
      label: "Updates available",
      value: formatMetricCount(counts.updatesAvailable),
      change: "Newer upstream versions",
      trend: "neutral",
    },
    {
      label: "Security updates",
      value: formatMetricCount(counts.securityUpdates),
      change: "CVE or security fix in the new release",
      trend: counts.securityUpdates > 0 ? "down" : "neutral",
    },
    {
      label: "P1 updates",
      value: formatMetricCount(counts.p1Updates),
      change: "Production security or overdue fixes",
      trend: counts.p1Updates > 0 ? "down" : "neutral",
    },
    {
      label: "Review required",
      value: formatMetricCount(counts.reviewRequired),
      change: "Major or breaking changes",
      trend: "neutral",
    },
    {
      label: "Packages scanned",
      value: formatMetricCount(scan.componentsFound),
      change: scan.label,
      trend: "neutral",
    },
  ];
}

export function dashboardFromSession(scan: SessionScanResult | null): DashboardOverviewResponse {
  if (!scan) {
    return {
      stats: [],
      findings: [],
      updates: [],
      scans: [],
      changes: [],
      trends: [],
      priority: { P1: 0, P2: 0, P3: 0, P4: 0 },
    };
  }

  const updates = sortAvailableUpdates(scan.snapshot.components)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      projectId: scan.id,
      projectName: scan.label,
    }));

  const priority = { P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const item of sortAvailableUpdates(scan.snapshot.components)) {
    if (item.priority === "P1" || item.priority === "P2" || item.priority === "P3" || item.priority === "P4") {
      priority[item.priority] += 1;
    }
  }

  const alerts = (scan.snapshot.changes?.alerts ?? []).slice(0, 12).map((alert) => ({
    projectId: scan.id,
    projectName: scan.label,
    kind: alert.kind,
    severity: alert.severity,
    summary: alert.summary,
  }));

  return {
    stats: statsFromScan(scan),
    findings: findingsFromSession(scan).slice(0, 16),
    updates,
    scans: [
      {
        id: scan.id,
        projectId: scan.id,
        projectName: scan.label,
        source: scan.source,
        status: "completed",
        completedAt: scan.scannedAt,
        componentsFound: scan.componentsFound,
        findingsFound: scan.findingsFound,
      },
    ],
    changes: alerts,
    trends: [],
    priority,
  };
}
