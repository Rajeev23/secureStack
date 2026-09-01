import { describe, expect, it, vi } from "vitest";
import { runSessionFilesScan, runSessionGitHubScan, runSessionSbomScan } from "@/services/session-scan/run";
import { scanGitHubRepository } from "@/services/scanner/scan-repository";

vi.mock("@/services/intelligence/enrich", () => ({
  enrichComponents: vi.fn(async (components: Array<{ name: string }>) => ({
    components: components.map((component) => ({
      ...component,
      latestVersion: "2.0.0",
      versionStatus: "major",
      cves: [],
      eolStatus: "unknown",
      eolDate: null,
      recommendedVersion: "2.0.0",
      recommendation: "Update",
      recommendationKind: "update",
      hasSecurityFix: false,
      releasedAt: null,
      releaseUrl: null,
      changeSummary: { security: [], bugfix: [], performance: [], breaking: [], other: [] },
      impact: "none",
      impactReasons: [],
      priority: "P4",
      priorityScore: 0,
      priorityWhy: "",
      slaDays: null,
      slaLabel: null,
    })),
    findings: [],
    coverage: { uniquePackages: components.length, checkedPackages: components.length, truncated: false },
  })),
}));

vi.mock("@/services/scanner/scan-repository", () => ({
  scanGitHubRepository: vi.fn(async (_token: string, fullName: string) => ({
    files: ["package.json"],
    components: [
      {
        name: fullName.endsWith("api") ? "hono" : "zod",
        ecosystem: "npm",
        version: "3.0.0",
        sourceFile: "package.json",
        fromLockfile: false,
        declaredDirect: true,
        tier: "direct",
        upstreamRepo: null,
        directParent: null,
      },
    ],
  })),
}));

describe("session scans", () => {
  it("parses an uploaded package.json without writing a database row", async () => {
    const result = await runSessionFilesScan({
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name: "demo",
            dependencies: { zod: "3.0.0" },
          }),
        },
      ],
    });

    expect(result.source).toBe("files");
    expect(result.snapshot.components.some((row) => row.name === "zod")).toBe(true);
    expect(result.label).toBe("package.json");
  });

  it("parses a CycloneDX SBOM", async () => {
    const result = await runSessionSbomScan({
      document: {
        bomFormat: "CycloneDX",
        components: [{ name: "left-pad", version: "1.3.0", purl: "pkg:npm/left-pad@1.3.0" }],
      },
    });

    expect(result.source).toBe("sbom");
    expect(result.snapshot.components.some((row) => row.name === "left-pad")).toBe(true);
  });

  it("rejects an empty file list", async () => {
    await expect(runSessionFilesScan({ files: [] })).rejects.toThrow(/at least one/i);
  });

  it("merges a full scan of several GitHub repositories", async () => {
    const result = await runSessionGitHubScan({
      token: "token",
      repositories: [
        { fullName: "acme/app", branch: "main" },
        { fullName: "acme/api", branch: "main" },
      ],
    });

    expect(result.label).toBe("2 repositories");
    expect(result.snapshot.repositories.map((row) => row.fullName)).toEqual(["acme/app", "acme/api"]);
    expect(result.snapshot.components.map((row) => row.name)).toEqual(["zod", "hono"]);
  });

  it("passes selected files to a single GitHub repository", async () => {
    await runSessionGitHubScan({
      token: "token",
      repositories: [{ fullName: "acme/app", branch: "main" }],
      paths: ["bom.yaml"],
    });

    expect(scanGitHubRepository).toHaveBeenCalledWith("token", "acme/app", "main", { paths: ["bom.yaml"] });
  });

  it("rejects specific files across multiple GitHub repositories", async () => {
    await expect(
      runSessionGitHubScan({
        token: "token",
        repositories: [{ fullName: "acme/app" }, { fullName: "acme/api" }],
        paths: ["package.json"],
      }),
    ).rejects.toThrow(/one repository/i);
  });
});
