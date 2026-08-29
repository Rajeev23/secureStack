import { describe, expect, it } from "vitest";
import {
  FINDING_STATUS_PALETTE,
  FINDING_TYPE_PALETTE,
  PRIORITY_PALETTE,
  SEVERITY_PALETTE,
  TOKENS,
  VERSION_STATUS_PALETTE,
  getPaletteEntry,
  lookupPalette,
} from "@/config/issue-palette";

describe("getPaletteEntry", () => {
  it("returns MEDIUM as caution amber", () => {
    const medium = getPaletteEntry(SEVERITY_PALETTE, "MEDIUM");
    expect(medium.label).toBe("Medium");
    expect(medium.color).toBe(TOKENS.caution);
  });

  it("falls back to UNKNOWN on missing keys", () => {
    expect(getPaletteEntry(SEVERITY_PALETTE, "mystery").label).toBe("Unknown");
    expect(getPaletteEntry(SEVERITY_PALETTE, null).label).toBe("Unknown");
    expect(getPaletteEntry(SEVERITY_PALETTE, "critical").label).toBe("Unknown");
  });
});

describe("lookupPalette", () => {
  it("matches severity keys case-insensitively", () => {
    expect(lookupPalette(SEVERITY_PALETTE, "critical").label).toBe("Critical");
    expect(lookupPalette(SEVERITY_PALETTE, "HIGH").color).toBe(TOKENS.danger);
  });

  it("maps finding types, statuses, version drift, and priority tokens", () => {
    expect(lookupPalette(FINDING_TYPE_PALETTE, "SECURITY").label).toBe("Security");
    expect(lookupPalette(FINDING_STATUS_PALETTE, "IN_PROGRESS").color).toBe(TOKENS.caution);
    expect(lookupPalette(VERSION_STATUS_PALETTE, "major").color).toBe(TOKENS.warning);
    expect(lookupPalette(PRIORITY_PALETTE, "P1").color).toBe(TOKENS.critical);
  });

  it("falls back without throwing on unknown keys", () => {
    expect(lookupPalette(SEVERITY_PALETTE, "mystery").label).toBe("Unknown");
    expect(lookupPalette(SEVERITY_PALETTE, null).label).toBe("Unknown");
  });
});
