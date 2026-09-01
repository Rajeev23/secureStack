import { describe, expect, it } from "vitest";
import { getBreadcrumbsFromPath } from "@/lib/breadcrumbs";

const names = { "6a6d9bb9-1854-4070-8cdd-c8af97c5c0db": "secure desk" };

describe("getBreadcrumbsFromPath", () => {
  it("uses the project name instead of the UUID", () => {
    const crumbs = getBreadcrumbsFromPath(
      "/projects/6a6d9bb9-1854-4070-8cdd-c8af97c5c0db/overview",
      { projectNames: names },
    );
    expect(crumbs.map((item) => item.label)).toEqual(["Projects", "secure desk"]);
    expect(crumbs.at(-1)?.href).toBeUndefined();
  });

  it("does not leave the UUID in the trail while names are loading", () => {
    const crumbs = getBreadcrumbsFromPath("/projects/6a6d9bb9-1854-4070-8cdd-c8af97c5c0db/overview");
    expect(crumbs.map((item) => item.label)).toEqual(["Projects", "Project"]);
    expect(crumbs.some((item) => item.label.includes("6a6d9bb9"))).toBe(false);
  });

  it("adds Inventory and the package name", () => {
    const crumbs = getBreadcrumbsFromPath(
      "/projects/6a6d9bb9-1854-4070-8cdd-c8af97c5c0db/inventory/cdi",
      { projectNames: names },
    );
    expect(crumbs.map((item) => item.label)).toEqual(["Projects", "secure desk", "Inventory", "cdi"]);
    expect(crumbs[1]?.href).toBe("/projects/6a6d9bb9-1854-4070-8cdd-c8af97c5c0db/overview");
    expect(crumbs[2]?.href).toBe("/projects/6a6d9bb9-1854-4070-8cdd-c8af97c5c0db/inventory");
  });

  it("joins scoped package segments", () => {
    const crumbs = getBreadcrumbsFromPath(
      "/projects/6a6d9bb9-1854-4070-8cdd-c8af97c5c0db/inventory/%40hono/node-server",
      { projectNames: names },
    );
    expect(crumbs.at(-1)?.label).toBe("@hono/node-server");
  });

  it("joins scoped package segments on the session inventory route", () => {
    const crumbs = getBreadcrumbsFromPath("/inventory/%40hono/node-server");
    expect(crumbs.map((item) => item.label)).toEqual(["Report", "@hono/node-server"]);
  });
});
