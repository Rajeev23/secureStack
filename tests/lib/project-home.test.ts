import { describe, expect, it } from "vitest";
import { projectHomeHref, projectNeedsGithubConnect } from "@/features/projects/model";
import type { Project } from "@/features/projects/model";

const base: Omit<Project, "repositories"> = {
  id: "proj-1",
  companyId: "co-1",
  name: "Payments",
  description: null,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("projectHomeHref", () => {
  it("resumes Connect GitHub when no repository is linked", () => {
    const project = { ...base, repositories: [] };
    expect(projectNeedsGithubConnect(project)).toBe(true);
    expect(projectHomeHref(project)).toBe("/projects/proj-1/connect");
  });

  it("opens the project page after a repository is linked", () => {
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
    };
    expect(projectNeedsGithubConnect(project)).toBe(false);
    expect(projectHomeHref(project)).toBe("/projects/proj-1");
  });
});
