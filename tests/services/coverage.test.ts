import { describe, expect, it } from "vitest";
import {
  MAX_INTEL_PACKAGES,
  mergeCoverage,
  selectIntelBudget,
  uniqueByKey,
} from "@/services/intelligence/coverage";
import { MAX_MANIFEST_FILES } from "@/services/scanner/scan-repository";
import { paginate, parsePageQuery } from "@/lib/pagination";
import { scanListSnapshot } from "@/services/scanner/summary";

describe("selectIntelBudget", () => {
  it("keeps every unique package when under the cap", () => {
    const unique = [{ name: "axios" }, { name: "react" }];
    expect(selectIntelBudget(unique, 80)).toEqual({
      selected: unique,
      coverage: { uniquePackages: 2, checkedPackages: 2, truncated: false },
    });
  });

  it("prioritizes infra and direct packages when truncated", () => {
    const unique = [
      ...Array.from({ length: 10 }, (_, index) => ({
        name: `helper-${index}`,
        tier: "transitive" as const,
      })),
      { name: "runc", tier: "infra" as const },
      { name: "react", tier: "direct" as const },
    ];
    const result = selectIntelBudget(unique, 2);
    expect(result.selected.map((item) => item.name)).toEqual(["runc", "react"]);
    expect(result.coverage.truncated).toBe(true);
  });

  it("records truncation when unique packages exceed the cap", () => {
    const unique = Array.from({ length: MAX_INTEL_PACKAGES + 25 }, (_, index) => ({ name: `pkg-${index}` }));
    const result = selectIntelBudget(unique);
    expect(result.selected).toHaveLength(MAX_INTEL_PACKAGES);
    expect(result.coverage).toEqual({
      uniquePackages: MAX_INTEL_PACKAGES + 25,
      checkedPackages: MAX_INTEL_PACKAGES,
      truncated: true,
    });
  });
});

describe("uniqueByKey", () => {
  it("keeps the first occurrence of each key", () => {
    expect(
      uniqueByKey(
        [
          { ecosystem: "npm", name: "axios", version: "1.0.0" },
          { ecosystem: "npm", name: "axios", version: "1.2.0" },
          { ecosystem: "pypi", name: "flask", version: "2.0.0" },
        ],
        (item) => `${item.ecosystem}:${item.name}`,
      ),
    ).toEqual([
      { ecosystem: "npm", name: "axios", version: "1.0.0" },
      { ecosystem: "pypi", name: "flask", version: "2.0.0" },
    ]);
  });
});

describe("mergeCoverage", () => {
  it("flags truncation if any scan was capped", () => {
    expect(
      mergeCoverage([
        { uniquePackages: 10, checkedPackages: 10, truncated: false },
        { uniquePackages: 500, checkedPackages: 400, truncated: true },
      ]),
    ).toEqual({ uniquePackages: 510, checkedPackages: 410, truncated: true });
  });
});

describe("scanListSnapshot", () => {
  it("drops components from list payloads", () => {
    const slim = scanListSnapshot({
      repositories: [{ fullName: "acme/app", branch: "main", files: ["package.json"] }],
      components: [{ name: "axios", ecosystem: "npm", version: "1.7.9", sourceFile: "package.json", repository: "acme/app" }],
      changes: {
        added: [],
        removed: [],
        updated: [],
        newCves: ["CVE-2024-1"],
        resolvedCves: [],
        alerts: [{ kind: "cve", severity: "HIGH", summary: "New CVE" }],
      },
      coverage: { uniquePackages: 1, checkedPackages: 1, truncated: false },
    });
    expect(slim?.components).toEqual([]);
    expect(slim?.changes?.newCves).toEqual(["CVE-2024-1"]);
    expect(slim?.coverage?.checkedPackages).toBe(1);
  });
});

describe("parsePageQuery", () => {
  it("clamps limit and offset", () => {
    expect(parsePageQuery(new URLSearchParams("limit=9999&offset=-4"))).toEqual({ offset: 0, limit: 250 });
    expect(parsePageQuery(new URLSearchParams())).toEqual({ offset: 0, limit: 100 });
  });
});

describe("paginate", () => {
  it("returns a slice and hasMore", () => {
    const page = paginate(["a", "b", "c", "d"], 1, 2);
    expect(page).toEqual({ items: ["b", "c"], total: 4, offset: 1, limit: 2, hasMore: true });
  });
});

describe("scanner caps", () => {
  it("exports a documented manifest file cap", () => {
    expect(MAX_MANIFEST_FILES).toBe(80);
  });
});
