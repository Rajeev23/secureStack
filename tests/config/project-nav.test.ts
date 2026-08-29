import { describe, expect, it } from "vitest";
import {
  SIDEBAR_PROJECT_LIMIT,
  projectNavChildren,
  withProjectNavItems,
} from "@/config/project-nav";
import type { NavItem } from "@/types/navigation";

const projectsItem: NavItem = { title: "Projects", href: "/projects" };
const dashboardItem: NavItem = { title: "Dashboard", href: "/dashboard" };

describe("projectNavChildren", () => {
  it("hides nested names when there are fewer than two projects", () => {
    expect(projectNavChildren([])).toBeUndefined();
    expect(projectNavChildren([{ id: "1", name: "Only" }])).toBeUndefined();
  });

  it("sends unfinished scan-scope setup back to Connect GitHub", () => {
    const children = projectNavChildren([
      { id: "a", name: "Alpha", repositories: [{ repositoryId: "1" }], scanScopeConfigured: false },
      { id: "b", name: "Beta", repositories: [{ repositoryId: "2" }], scanScopeConfigured: true },
    ]);
    expect(children?.[0]?.href).toBe("/projects/a/connect");
    expect(children?.[1]?.href).toBe("/projects/b/overview");
  });

  it("lists each project when there are two or more", () => {
    const children = projectNavChildren([
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
    ]);
    expect(children).toEqual([
      { title: "Alpha", href: "/projects/a/overview", match: "prefix" },
      { title: "Beta", href: "/projects/b/overview", match: "prefix" },
    ]);
  });

  it("caps nested names and adds View all", () => {
    const many = Array.from({ length: SIDEBAR_PROJECT_LIMIT + 1 }, (_, index) => ({
      id: String(index + 1),
      name: `P${index + 1}`,
    }));
    const children = projectNavChildren(many) ?? [];
    expect(children).toHaveLength(SIDEBAR_PROJECT_LIMIT + 1);
    expect(children.at(-1)).toEqual({ title: "View all projects", href: "/projects" });
    expect(children[0]?.href).toBe("/projects/1/overview");
  });
});

describe("withProjectNavItems", () => {
  it("omits Projects until the company has at least one", () => {
    const next = withProjectNavItems([dashboardItem, projectsItem], []);
    expect(next.map((item) => item.href)).toEqual(["/dashboard"]);
  });

  it("keeps Projects while the list is still loading", () => {
    const next = withProjectNavItems([dashboardItem, projectsItem], undefined);
    expect(next.map((item) => item.href)).toEqual(["/dashboard", "/projects"]);
  });

  it("attaches children only to Projects", () => {
    const next = withProjectNavItems(
      [dashboardItem, projectsItem],
      [
        { id: "a", name: "Alpha" },
        { id: "b", name: "Beta" },
      ],
    );
    expect(next[0]?.children).toBeUndefined();
    expect(next[1]?.children).toHaveLength(2);
  });

  it("clears leftover children when only one project remains", () => {
    const next = withProjectNavItems(
      [{ ...projectsItem, children: [{ title: "Old", href: "/projects/old" }] }],
      [{ id: "a", name: "Alpha" }],
    );
    expect(next[0]?.children).toBeUndefined();
  });
});
