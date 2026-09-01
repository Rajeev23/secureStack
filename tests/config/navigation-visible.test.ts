import { describe, expect, it } from "vitest";
import { isNavItemVisible, visibleNavItems } from "@/config/navigation";

describe("isNavItemVisible", () => {
  it("treats omitted visible as shown", () => {
    expect(isNavItemVisible({})).toBe(true);
  });

  it("hides when visible is false", () => {
    expect(isNavItemVisible({ visible: false })).toBe(false);
  });
});

describe("visibleNavItems", () => {
  it("drops hidden items", () => {
    const visible = visibleNavItems([
      { title: "Scan", href: "/scan" },
      { title: "Documentation", href: "/documentation", visible: false },
    ]);
    expect(visible.map((item) => item.title)).toEqual(["Scan"]);
  });
});
