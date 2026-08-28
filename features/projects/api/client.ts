import { z } from "zod";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { githubRepoSchema, projectSchema, type GithubRepo, type Project } from "@/features/projects/model";

const projectsResponseSchema = z.object({
  projects: z.array(projectSchema),
});

const projectResponseSchema = z.object({
  project: projectSchema,
});

const reposResponseSchema = z.object({
  repositories: z.array(githubRepoSchema),
});

export async function fetchProjects(): Promise<Project[]> {
  const data = await apiGet<unknown>("/api/projects");
  return projectsResponseSchema.parse(data).projects;
}

export async function fetchProject(id: string): Promise<Project> {
  const data = await apiGet<unknown>(`/api/projects/${id}`);
  return projectResponseSchema.parse(data).project;
}

export async function createProject(input: {
  name: string;
  description?: string;
  environment?: Project["environment"];
}): Promise<Project> {
  const data = await apiPost<unknown>("/api/projects", input);
  return projectResponseSchema.parse(data).project;
}

export async function connectProjectRepositories(
  projectId: string,
  repositories: Project["repositories"],
): Promise<Project> {
  const data = await apiPatch<unknown>(`/api/projects/${projectId}`, { repositories });
  return projectResponseSchema.parse(data).project;
}

export async function updateProjectMonitoring(
  projectId: string,
  patch: { monitoringEnabled?: boolean; environment?: Project["environment"] },
): Promise<Project> {
  const data = await apiPatch<unknown>(`/api/projects/${projectId}`, patch);
  return projectResponseSchema.parse(data).project;
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiDelete<{ ok: boolean }>(`/api/projects/${projectId}`);
}

export async function fetchGithubRepositories(): Promise<GithubRepo[]> {
  const data = await apiGet<unknown>("/api/github/repositories");
  return reposResponseSchema.parse(data).repositories;
}
