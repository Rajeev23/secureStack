import { describe, expect, it } from "vitest";
import { isNavItemActive, isNavSectionActive } from "@/components/layout/sidebar/nav-utils";
import type { NavItem } from "@/types/navigation";

describe("isNavItemActive", () => {
  it("matches nested project routes when match is prefix", () => {
    const item: NavItem = { title: "App", href: "/projects/abc/overview", match: "prefix" };
    expect(isNavItemActive("/projects/abc/overview", item)).toBe(true);
    expect(isNavItemActive("/projects/abc/inventory", item)).toBe(true);
    expect(isNavItemActive("/projects/abc/connect", item)).toBe(true);
    expect(isNavItemActive("/projects/abcd", item)).toBe(false);
  });

  it("uses exact match by default", () => {
    const item: NavItem = { title: "App", href: "/projects/abc" };
    expect(isNavItemActive("/projects/abc", item)).toBe(true);
    expect(isNavItemActive("/projects/abc/connect", item)).toBe(false);
  });
});

describe("isNavSectionActive", () => {
  it("treats any project route as the Projects section", () => {
    const item: NavItem = {
      title: "Projects",
      href: "/projects",
      children: [{ title: "App", href: "/projects/abc", match: "prefix" }],
    };
    expect(isNavSectionActive("/projects", item)).toBe(true);
    expect(isNavSectionActive("/projects/new", item)).toBe(true);
    expect(isNavSectionActive("/projects/abc", item)).toBe(true);
    expect(isNavSectionActive("/dashboard", item)).toBe(false);
  });
});
