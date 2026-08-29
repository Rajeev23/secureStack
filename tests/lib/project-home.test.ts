import { describe, expect, it } from "vitest";
import { projectHomeHref, projectInventoryItemHref, projectNeedsConnectSetup, projectNeedsGithubConnect, inventoryNameFromSegments } from "@/features/projects/model";
import type { Project } from "@/features/projects/model";

const base: Omit<Project, "repositories"> = {
  id: "proj-1",
  companyId: "co-1",
  name: "Payments",
  description: null,
  status: "active",
  scanMode: "full",
  files: [],
  scanScopeConfigured: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("projectHomeHref", () => {
  it("resumes Connect GitHub when no repository is linked", () => {
    const project = { ...base, repositories: [] };
    expect(projectNeedsGithubConnect(project)).toBe(true);
    expect(projectHomeHref(project)).toBe("/projects/proj-1/connect");
  });

  it("resumes setup when a repository is linked but scan scope is not chosen", () => {
    const project: Project = {
      ...base,
      repositories: [
        {
          provider: "github",
          repositoryId: "1",
          fullName: "acme/payments",
          url: "https://github.com/acme/payments",
          branch: "main",
        },
      ],
      scanScopeConfigured: false,
    };
    expect(projectNeedsGithubConnect(project)).toBe(false);
    expect(projectNeedsConnectSetup(project)).toBe(true);
    expect(projectHomeHref(project)).toBe("/projects/proj-1/connect");
  });

  it("opens the project page after a repository and scan scope are saved", () => {
    const project: Project = {
      ...base,
      scanScopeConfigured: true,
      repositories: [
        {
          provider: "github",
          repositoryId: "1",
          fullName: "acme/payments",
          url: "https://github.com/acme/payments",
          branch: "main",
        },
      ],
    };
    expect(projectNeedsGithubConnect(project)).toBe(false);
    expect(projectNeedsConnectSetup(project)).toBe(false);
    expect(projectHomeHref(project)).toBe("/projects/proj-1/overview");
  });
});

describe("projectInventoryItemHref", () => {
  it("uses the package name in the path", () => {
    expect(projectInventoryItemHref("proj-1", "cdi")).toBe("/projects/proj-1/inventory/cdi");
  });

  it("keeps scoped names as extra segments", () => {
    expect(projectInventoryItemHref("proj-1", "@hono/node-server")).toBe(
      "/projects/proj-1/inventory/%40hono/node-server",
    );
    expect(inventoryNameFromSegments(["%40hono", "node-server"])).toBe("@hono/node-server");
  });
});
