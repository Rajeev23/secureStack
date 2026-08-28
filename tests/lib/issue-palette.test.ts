import { describe, expect, it } from "vitest";
import {
  FINDING_STATUS_PALETTE,
  FINDING_TYPE_PALETTE,
  SEVERITY_PALETTE,
  VERSION_STATUS_PALETTE,
  lookupPalette,
} from "@/config/issue-palette";

describe("lookupPalette", () => {
  it("returns MEDIUM as warning amber, not a muted default", () => {
    const medium = lookupPalette(SEVERITY_PALETTE, "MEDIUM");
    expect(medium.label).toBe("Medium");
    expect(medium.color).toBe("var(--warning)");
  });

  it("matches severity keys case-insensitively", () => {
    expect(lookupPalette(SEVERITY_PALETTE, "critical").label).toBe("Critical");
    expect(lookupPalette(SEVERITY_PALETTE, "HIGH").color).toBe("#ea580c");
  });

  it("maps finding types, statuses, and version drift", () => {
    expect(lookupPalette(FINDING_TYPE_PALETTE, "SECURITY").label).toBe("Security");
    expect(lookupPalette(FINDING_STATUS_PALETTE, "IN_PROGRESS").label).toBe("In progress");
    expect(lookupPalette(VERSION_STATUS_PALETTE, "major").label).toBe("Major update");
  });

  it("falls back without throwing on unknown keys", () => {
    expect(lookupPalette(SEVERITY_PALETTE, "mystery").label).toBe("mystery");
    expect(lookupPalette(SEVERITY_PALETTE, null).label).toBe("Unknown");
  });
});
