import { z } from "zod";

/** Keep in sync with MAX_WATCH_FILES on the server. */
export const MAX_PROJECT_WATCH_FILES = 80;

export const projectRepositorySchema = z.object({
  provider: z.literal("github"),
  repositoryId: z.string(),
  fullName: z.string(),
  url: z.string(),
  branch: z.string(),
});

export const projectSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  repositories: z.array(projectRepositorySchema),
  status: z.enum(["active", "archived"]),
  monitoringEnabled: z.boolean().optional(),
  environment: z.enum(["production", "staging", "development", "unknown"]).optional(),
  scanMode: z.enum(["full", "selected"]).default("full"),
  files: z.array(z.string()).default([]),
  scanScopeConfigured: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectRepository = z.infer<typeof projectRepositorySchema>;
export type Project = z.infer<typeof projectSchema>;

export function projectRepositoryName(project: Project): string | null {
  return project.repositories[0]?.fullName ?? null;
}

export function projectNeedsGithubConnect(project: Pick<Project, "repositories">): boolean {
  return project.repositories.length === 0;
}

export function projectNeedsConnectSetup(
  project: Pick<Project, "repositories" | "scanScopeConfigured">,
): boolean {
  if (projectNeedsGithubConnect(project)) return true;
  return project.scanScopeConfigured === false;
}

export function projectOverviewHref(projectId: string, options?: { skipConnect?: boolean }): string {
  const path = `/projects/${projectId}/overview`;
  return options?.skipConnect ? `${path}?connect=skip` : path;
}

export function projectInventoryHref(projectId: string): string {
  return `/projects/${projectId}/inventory`;
}

export function projectScansHref(projectId: string): string {
  return `/projects/${projectId}/scans`;
}

export function projectInventoryItemHref(projectId: string, name: string): string {
  const slug = name.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `/projects/${projectId}/inventory/${slug}`;
}

export function inventoryNameFromSegments(segments: string[]): string {
  return segments.map((part) => decodeURIComponent(part)).join("/");
}

export function projectHomeHref(project: Pick<Project, "id" | "repositories" | "scanScopeConfigured">): string {
  return projectNeedsConnectSetup(project)
    ? `/projects/${project.id}/connect`
    : projectOverviewHref(project.id);
}

export const githubRepoSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  name: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  htmlUrl: z.string(),
  description: z.string().nullable(),
});

export type GithubRepo = z.infer<typeof githubRepoSchema>;

export const githubFileSearchSchema = z.object({
  files: z.array(z.string()),
  truncated: z.boolean(),
  matched: z.number(),
});

export type GithubFileSearch = z.infer<typeof githubFileSearchSchema>;
