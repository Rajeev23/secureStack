import { describe, expect, it } from "vitest";
import { getBreadcrumbsFromPath } from "@/lib/breadcrumbs";

describe("getBreadcrumbsFromPath", () => {
  it("uses nav titles for known routes", () => {
    expect(getBreadcrumbsFromPath("/dashboard").map((item) => item.label)).toEqual(["Dashboard"]);
    expect(getBreadcrumbsFromPath("/scan").map((item) => item.label)).toEqual(["Scan"]);
    expect(getBreadcrumbsFromPath("/inventory").map((item) => item.label)).toEqual(["Report"]);
  });

  it("joins scoped package segments on the session inventory route", () => {
    const crumbs = getBreadcrumbsFromPath("/inventory/%40hono/node-server");
    expect(crumbs.map((item) => item.label)).toEqual(["Report", "@hono/node-server"]);
  });
});
