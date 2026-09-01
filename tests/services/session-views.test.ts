import { describe, expect, it } from "vitest";
import { dashboardFromSession, findingsFromSession, sessionInventoryHref } from "@/features/scan-session/lib/derive";
import type { SessionScanResult } from "@/services/session-scan/types";

const scan: SessionScanResult = {
  id: "scan-1",
  source: "files",
  label: "package.json",
  scannedAt: "2026-08-31T12:00:00.000Z",
  componentsFound: 1,
  findingsFound: 1,
  snapshot: {
    repositories: [{ fullName: "upload", branch: "upload", files: ["package.json"] }],
    components: [
      {
        name: "zod",
        ecosystem: "npm",
        version: "3.0.0",
        sourceFile: "package.json",
        repository: "upload",
        tier: "direct",
        upstreamRepo: null,
        directParent: null,
        latestVersion: "3.24.0",
        versionStatus: "minor",
        cves: ["CVE-2024-0001"],
        eolStatus: "unknown",
        eolDate: null,
        recommendedVersion: "3.24.0",
        recommendation: "Update urgently",
        recommendationKind: "update_urgent",
        hasSecurityFix: true,
        releasedAt: null,
        releaseUrl: null,
        changeSummary: { security: ["fix"], bugfix: [], performance: [], breaking: [], other: [] },
        applicationName: "demo",
        environment: "unknown",
        impact: "high",
        impactReasons: [],
        priority: "P1",
        priorityScore: 90,
        priorityWhy: "CVE",
        slaDays: 1,
        slaLabel: "now",
      },
    ],
    changes: {
      added: [],
      removed: [],
      updated: [],
      newCves: ["CVE-2024-0001"],
      resolvedCves: [],
      alerts: [{ kind: "security", severity: "HIGH", summary: "zod is affected by CVE-2024-0001." }],
    },
  },
  findings: [
    {
      componentName: "zod",
      ecosystem: "npm",
      currentVersion: "3.0.0",
      recommendedVersion: "3.24.0",
      findingType: "SECURITY",
      severity: "HIGH",
      externalReference: "CVE-2024-0001",
      recommendation: "Update zod",
    },
  ],
};

describe("session scan views", () => {
  it("builds inventory hrefs for scoped packages", () => {
    expect(sessionInventoryHref("@hono/node-server")).toBe("/inventory/%40hono/node-server");
  });

  it("turns drafts into open findings", () => {
    const findings = findingsFromSession(scan);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.status).toBe("OPEN");
    expect(findings[0]?.componentName).toBe("zod");
  });

  it("summarizes a dashboard from the in-memory scan", () => {
    const overview = dashboardFromSession(scan);
    expect(overview.projects).toEqual([]);
    expect(overview.findings).toHaveLength(1);
    expect(overview.priority?.P1).toBe(1);
    expect(overview.changes[0]?.summary).toContain("CVE-2024-0001");
  });
});
