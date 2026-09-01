import { describe, expect, it } from "vitest";
import { appConfig } from "@/config/app";
import {
  documentationNavItem,
  isDocumentationVisible,
  isNavItemVisible,
  secondaryNavigation,
  visibleNavItems,
} from "@/config/navigation";

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

describe("documentation placement", () => {
  it("keeps documentationNavItem as the docs route", () => {
    expect(documentationNavItem.href).toBe("/documentation");
    expect(documentationNavItem.external).toBe(true);
  });

  it("shows the home Docs link from appConfig.documentation.home", () => {
    expect(isDocumentationVisible).toBe(appConfig.documentation.home);
  });

  it("includes documentation in the app sidebar only when appConfig.documentation.sidebar is true", () => {
    const inSidebar = secondaryNavigation.some((item) => item.href === "/documentation");
    expect(inSidebar).toBe(appConfig.documentation.sidebar);
  });
});
