import { describe, expect, it } from "vitest";
import { draftFindingsFromComponents } from "@/services/intelligence/findings-from-snapshot";

describe("draftFindingsFromComponents", () => {
  it("emits a security finding per CVE", () => {
    const findings = draftFindingsFromComponents([
      {
        name: "axios",
        ecosystem: "npm",
        version: "1.0.0",
        tier: "direct",
        latestVersion: "1.8.2",
        recommendedVersion: "1.8.2",
        cves: ["CVE-2024-1", "CVE-2024-2"],
        impact: "critical",
      },
    ]);
    const security = findings.filter((item) => item.findingType === "SECURITY");
    expect(security).toHaveLength(2);
    expect(security.map((item) => item.externalReference)).toEqual(["CVE-2024-1", "CVE-2024-2"]);
    expect(security[0]?.severity).toBe("CRITICAL");
    expect(security.some((item) => item.findingType === "UPDATE")).toBe(false);
  });

  it("emits an update finding for outdated infra without CVEs", () => {
    const findings = draftFindingsFromComponents([
      {
        name: "runc",
        ecosystem: "github",
        version: "1.1.0",
        tier: "infra",
        latestVersion: "1.2.0",
        versionStatus: "minor",
        recommendationKind: "update",
        recommendation: "UPDATE recommended: runc from 1.1.0 to 1.2.0.",
        cves: [],
      },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.findingType).toBe("UPDATE");
    expect(findings[0]?.severity).toBe("LOW");
  });

  it("emits an EOL finding for approaching runtimes", () => {
    const findings = draftFindingsFromComponents([
      {
        name: "node",
        ecosystem: "docker",
        version: "18",
        tier: "infra",
        eolStatus: "approaching",
        eolDate: "2026-12-01",
        latestVersion: "22",
      },
    ]);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          findingType: "EOL",
          severity: "MEDIUM",
          externalReference: "2026-12-01",
        }),
      ]),
    );
  });

  it("skips duplicate components", () => {
    const component = {
      name: "lodash",
      ecosystem: "npm",
      version: "4.17.20",
      tier: "direct" as const,
      latestVersion: "4.17.21",
      cves: ["CVE-2021-23337"],
      impact: "high",
    };
    const findings = draftFindingsFromComponents([component, component]);
    expect(findings.filter((item) => item.findingType === "SECURITY")).toHaveLength(1);
  });
});
