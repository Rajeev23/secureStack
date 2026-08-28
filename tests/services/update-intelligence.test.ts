import { describe, expect, it } from "vitest";
import { classifyReleaseNotes, mergeChangeSummaries } from "@/services/intelligence/changelog";
import { githubRepoFromName, parseGithubRepoUrl } from "@/services/intelligence/github-repo";
import { osvPackageFor } from "@/services/intelligence/osv";
import { recommendationKindFor, updateIntelligenceRecommendation } from "@/services/intelligence/recommend";
import { summarizeUpdateIntel } from "@/services/intelligence/summarize";
import {
  filterDefaultInventory,
  groupHiddenTransitiveUpdates,
  isDefaultInventoryRow,
} from "@/services/intelligence/visibility";
import { isUpdateAvailable } from "@/services/intelligence/version";

describe("changelog classifier", () => {
  it("groups security, bugfix, and breaking notes", () => {
    const summary = classifyReleaseNotes(`
## What's Changed
- Fix CVE-2026-1234 in the runtime
- Bug fix for container execution
- BREAKING CHANGE: drop support for cgroup v1
- Improve performance of process start
`);
    expect(summary.security.length).toBeGreaterThan(0);
    expect(summary.bugfix.length).toBeGreaterThan(0);
    expect(summary.breaking.length).toBeGreaterThan(0);
    expect(summary.performance.length).toBeGreaterThan(0);
  });

  it("merges notes from multiple releases", () => {
    const merged = mergeChangeSummaries([
      classifyReleaseNotes("- Security fix for CVE-2026-1"),
      classifyReleaseNotes("- Fixed a crash on start"),
    ]);
    expect(merged.security).toHaveLength(1);
    expect(merged.bugfix).toHaveLength(1);
  });
});

describe("recommendationKindFor", () => {
  it("recommends UPDATE URGENTLY when the current version has a CVE", () => {
    expect(
      recommendationKindFor({
        versionStatus: "patch",
        hasSecurityFix: true,
        hasBreaking: false,
        cveCount: 1,
      }),
    ).toBe("update_urgent");
  });

  it("recommends UPDATE for a security patch without a current CVE", () => {
    expect(
      recommendationKindFor({
        versionStatus: "patch",
        hasSecurityFix: true,
        hasBreaking: false,
        cveCount: 0,
      }),
    ).toBe("update");
  });

  it("requires REVIEW for major or breaking changes", () => {
    expect(
      recommendationKindFor({
        versionStatus: "major",
        hasSecurityFix: true,
        hasBreaking: false,
        cveCount: 0,
      }),
    ).toBe("review");
    expect(
      recommendationKindFor({
        versionStatus: "minor",
        hasSecurityFix: false,
        hasBreaking: true,
        cveCount: 0,
      }),
    ).toBe("review");
  });

  it("marks minor non-security updates as not urgent", () => {
    expect(
      recommendationKindFor({
        versionStatus: "minor",
        hasSecurityFix: false,
        hasBreaking: false,
        cveCount: 0,
      }),
    ).toBe("wait");
  });
});

describe("updateIntelligenceRecommendation", () => {
  it("states UPDATE with versions", () => {
    expect(
      updateIntelligenceRecommendation({
        name: "runc",
        current: "1.4.2",
        latest: "1.4.3",
        kind: "update_urgent",
        versionStatus: "patch",
        hasSecurityFix: true,
        hasBreaking: false,
        changes: { security: ["CVE"], bugfix: [], performance: [], breaking: [], other: [] },
      }),
    ).toContain("UPDATE URGENTLY");
  });
});

describe("github repo mapping", () => {
  it("maps runc and GitHub URLs", () => {
    expect(githubRepoFromName("runc", "github")).toBe("opencontainers/runc");
    expect(parseGithubRepoUrl("https://github.com/facebook/react.git")).toBe("facebook/react");
    expect(githubRepoFromName("github.com/opencontainers/runc", "go")).toBe("opencontainers/runc");
  });
});

describe("summarizeUpdateIntel", () => {
  it("counts available updates by recommendation", () => {
    const counts = summarizeUpdateIntel([
      { name: "runc", ecosystem: "github", version: "1.4.2", versionStatus: "patch", recommendationKind: "update", hasSecurityFix: true, tier: "infra" },
      { name: "react", ecosystem: "npm", version: "19.2.4", versionStatus: "patch", recommendationKind: "update", tier: "direct" },
      { name: "babel", ecosystem: "npm", version: "7.0.0", versionStatus: "major", recommendationKind: "review", tier: "direct" },
      { name: "clsx", ecosystem: "npm", version: "2.0.0", versionStatus: "up_to_date", tier: "direct" },
      { name: "@babel/helper-globals", ecosystem: "npm", version: "7.0.0", versionStatus: "patch", tier: "transitive" },
    ]);
    expect(counts).toEqual({
      updatesAvailable: 3,
      securityUpdates: 1,
      highPriority: 2,
      reviewRequired: 1,
      lowRisk: 0,
      p1Updates: 0,
    });
  });

  it("infers review for major updates when recommendationKind is missing", () => {
    expect(
      summarizeUpdateIntel([
        { name: "babel", ecosystem: "npm", version: "7.0.0", versionStatus: "major" },
      ]),
    ).toMatchObject({ updatesAvailable: 1, reviewRequired: 1, highPriority: 0 });
  });
});

describe("isUpdateAvailable", () => {
  it("treats patch minor and major as available updates", () => {
    expect(isUpdateAvailable("patch")).toBe(true);
    expect(isUpdateAvailable("up_to_date")).toBe(false);
  });
});

describe("inventory visibility", () => {
  it("hides lockfile helpers even when the snapshot omitted tier", () => {
    expect(
      isDefaultInventoryRow({
        name: "@alloc/quick-lru",
        ecosystem: "npm",
        sourceFile: "package-lock.json",
      }),
    ).toBe(false);
    expect(
      isDefaultInventoryRow({
        name: "next",
        ecosystem: "npm",
        sourceFile: "package.json",
        declaredDirect: true,
      }),
    ).toBe(true);
    expect(isDefaultInventoryRow({ name: "runc", tier: "infra" })).toBe(true);
    expect(
      isDefaultInventoryRow({
        name: "@babel/helper-globals",
        tier: "transitive",
        hasSecurityFix: true,
      }),
    ).toBe(false);
    expect(
      isDefaultInventoryRow({
        name: "@babel/helper-globals",
        tier: "transitive",
        cves: ["CVE-2026-1"],
      }),
    ).toBe(true);
  });

  it("filters a 1k lockfile down to T1 + T2 + security T3", () => {
    const rows = [
      { name: "runc", tier: "infra" as const },
      { name: "react", tier: "direct" as const },
      ...Array.from({ length: 1000 }, (_, index) => ({
        name: `@babel/helper-${index}`,
        tier: "transitive" as const,
      })),
      { name: "left-pad", tier: "transitive" as const, cves: ["CVE-2024-1"] },
    ];
    const visible = filterDefaultInventory(rows);
    expect(visible.map((item) => item.name)).toEqual(["runc", "react", "left-pad"]);
  });

  it("groups hidden transitive updates by parent", () => {
    const groups = groupHiddenTransitiveUpdates([
      { name: "a", versionStatus: "patch", tier: "transitive", directParent: "next" },
      { name: "b", versionStatus: "patch", tier: "transitive", directParent: "next" },
      { name: "c", versionStatus: "patch", tier: "transitive", directParent: null },
    ]);
    expect(groups[0]).toMatchObject({ parent: "next", count: 2 });
    expect(groups[1]).toMatchObject({ parent: "other", count: 1 });
  });
});

describe("osvPackageFor", () => {
  it("maps github infra components to the Go module path", () => {
    expect(osvPackageFor({ name: "runc", ecosystem: "github", version: "1.4.2" })).toEqual({
      name: "github.com/opencontainers/runc",
      ecosystem: "Go",
    });
  });
});
