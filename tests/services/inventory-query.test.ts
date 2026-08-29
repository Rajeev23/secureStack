import { describe, expect, it } from "vitest";
import { matchComponentsByName } from "@/services/intelligence/inventory-query";

describe("matchComponentsByName", () => {
  it("matches names case-insensitively", () => {
    const rows = [
      { name: "cdi", version: "1" },
      { name: "runc", version: "2" },
      { name: "CDI", version: "3" },
    ];
    expect(matchComponentsByName(rows, "cdi").map((row) => row.version)).toEqual(["1", "3"]);
  });
});
