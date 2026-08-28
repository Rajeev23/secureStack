import { describe, expect, it } from "vitest";
import { diffSnapshots } from "@/services/intelligence/changes";
import type { ScanSnapshot } from "@/server/supabase/types";

function snapshot(
  components: Array<{
    name: string;
    version: string;
    cves?: string[];
    eolStatus?: string;
  }>,
): ScanSnapshot {
  return {
    repositories: [],
    components: components.map((component) => ({
      name: component.name,
      ecosystem: "npm",
      version: component.version,
      sourceFile: "package.json",
      repository: "acme/app",
      cves: component.cves,
      eolStatus: component.eolStatus,
    })),
  };
}

describe("diffSnapshots", () => {
  it("detects added, removed, and major version moves", () => {
    const previous = snapshot([{ name: "left-pad", version: "1.0.0" }, { name: "axios", version: "1.7.0" }]);
    const next = snapshot([{ name: "axios", version: "2.0.0" }, { name: "zod", version: "3.0.0" }]);
    const changes = diffSnapshots(previous, next);

    expect(changes.added.map((item) => item.name)).toEqual(["zod"]);
    expect(changes.removed.map((item) => item.name)).toEqual(["left-pad"]);
    expect(changes.updated).toEqual([
      { name: "axios", ecosystem: "npm", from: "1.7.0", to: "2.0.0", breaking: true },
    ]);
    expect(changes.alerts.some((alert) => alert.kind === "breaking")).toBe(true);
  });

  it("tracks new and resolved CVEs", () => {
    const previous = snapshot([{ name: "axios", version: "1.7.9", cves: ["CVE-2023-1"] }]);
    const next = snapshot([{ name: "axios", version: "1.7.9", cves: ["CVE-2024-2"] }]);
    const changes = diffSnapshots(previous, next);

    expect(changes.newCves).toEqual(["CVE-2024-2"]);
    expect(changes.resolvedCves).toEqual(["CVE-2023-1"]);
    expect(changes.alerts.map((alert) => alert.kind).sort()).toEqual(["resolved", "security"]);
  });

  it("limits first-scan alerts to security and EOL", () => {
    const next = snapshot([
      { name: "axios", version: "1.0.0", cves: ["CVE-2024-1"] },
      { name: "node", version: "14.0.0", eolStatus: "eol" },
    ]);
    const changes = diffSnapshots(null, next);
    expect(changes.updated).toEqual([]);
    expect(changes.removed).toEqual([]);
    expect(changes.alerts.every((alert) => alert.kind === "security" || alert.kind === "eol")).toBe(true);
  });
});
