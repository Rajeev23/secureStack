import { describe, expect, it } from "vitest";
import { formatMetricCount } from "@/lib/format-count";

describe("formatMetricCount", () => {
  it("keeps small counts as plain digits", () => {
    expect(formatMetricCount(0)).toBe("0");
    expect(formatMetricCount(2)).toBe("2");
    expect(formatMetricCount(999)).toBe("999");
  });

  it("compacts thousands and millions", () => {
    expect(formatMetricCount(1922)).toBe("1.9K");
    expect(formatMetricCount(1_200_000)).toBe("1.2M");
  });

  it("returns an em dash for non-finite values", () => {
    expect(formatMetricCount(Number.NaN)).toBe("—");
  });
});
