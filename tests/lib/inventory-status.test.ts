import { describe, expect, it } from "vitest";
import { inventoryTableStatus } from "@/features/inventory/components/intelligence-badges";

describe("inventoryTableStatus", () => {
  it("shows CVE count and the action, not a duplicate version-bump chip", () => {
    expect(
      inventoryTableStatus({
        cves: ["CVE-1", "CVE-2", "CVE-3", "CVE-4"],
        versionStatus: "minor",
        latestVersion: "1.20.1",
        recommendationKind: "update_urgent",
      }),
    ).toEqual([
      { type: "cve", cves: ["CVE-1", "CVE-2", "CVE-3", "CVE-4"] },
      { type: "recommendation", kind: "update_urgent" },
    ]);
  });

  it("shows review without a major-update chip", () => {
    expect(
      inventoryTableStatus({
        versionStatus: "major",
        latestVersion: "2.0.0",
        recommendationKind: "review",
      }),
    ).toEqual([{ type: "recommendation", kind: "review" }]);
  });

  it("shows up to date when there is nothing to do", () => {
    expect(
      inventoryTableStatus({
        versionStatus: "up_to_date",
        latestVersion: "1.0.0",
      }),
    ).toEqual([{ type: "version", status: "up_to_date" }]);
  });

  it("is empty when intelligence never ran", () => {
    expect(inventoryTableStatus({ versionStatus: "unknown" })).toEqual([]);
  });
});
