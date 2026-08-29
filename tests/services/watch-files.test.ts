import { describe, expect, it } from "vitest";
import { filterRepositoryFilePaths } from "@/services/scanner/search-files";
import { selectScanFiles } from "@/services/scanner/scan-repository";
import { normalizeWatchPath, normalizeWatchPaths } from "@/services/scanner/watch-paths";

describe("normalizeWatchPath", () => {
  it("rejects traversal and keeps repo-relative paths", () => {
    expect(normalizeWatchPath("package.json")).toBe("package.json");
    expect(normalizeWatchPath("/deploy/bom.yaml")).toBe("deploy/bom.yaml");
    expect(normalizeWatchPath("../secret")).toBeNull();
    expect(normalizeWatchPath("apps/../package.json")).toBeNull();
    expect(normalizeWatchPaths(["package.json", "package.json", "../x", "bom.yaml"])).toEqual([
      "package.json",
      "bom.yaml",
    ]);
  });
});

describe("filterRepositoryFilePaths", () => {
  const tree = [
    "package.json",
    "apps/api/package.json",
    "deploy/company-bom.yaml",
    "README.md",
    "node_modules/axios/package.json",
    "src/index.ts",
  ];

  it("lists known manifests when the query is empty", () => {
    expect(filterRepositoryFilePaths(tree, "").files).toEqual(["apps/api/package.json", "package.json"]);
  });

  it("finds custom filenames and skips vendor trees", () => {
    expect(filterRepositoryFilePaths(tree, "bom").files).toEqual(["deploy/company-bom.yaml"]);
    expect(filterRepositoryFilePaths(tree, "package.json").files).toEqual([
      "package.json",
      "apps/api/package.json",
    ]);
    expect(filterRepositoryFilePaths(tree, "package.json").files).not.toContain(
      "node_modules/axios/package.json",
    );
  });
});

describe("selectScanFiles", () => {
  const tree = ["package.json", "package-lock.json", "deploy/company-bom.yaml", "README.md"];

  it("auto-detects known manifests for a full scan", () => {
    expect(selectScanFiles(tree)).toEqual(["package.json", "package-lock.json"]);
  });

  it("keeps only the company-selected files", () => {
    expect(selectScanFiles(tree, ["deploy/company-bom.yaml", "missing.yaml"])).toEqual([
      "deploy/company-bom.yaml",
    ]);
  });
});
