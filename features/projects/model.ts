import { z } from "zod";

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

export function projectHomeHref(project: Pick<Project, "id" | "repositories">): string {
  return projectNeedsGithubConnect(project)
    ? `/projects/${project.id}/connect`
    : `/projects/${project.id}`;
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
