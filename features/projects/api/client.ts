import { z } from "zod";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import {
  githubFileSearchSchema,
  githubRepoSchema,
  projectSchema,
  type GithubFileSearch,
  type GithubRepo,
  type Project,
} from "@/features/projects/model";

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
  input: {
    repositories: Project["repositories"];
    scanMode?: Project["scanMode"];
    files?: string[];
  },
): Promise<Project> {
  const data = await apiPatch<unknown>(`/api/projects/${projectId}`, input);
  return projectResponseSchema.parse(data).project;
}

export async function updateProjectMonitoring(
  projectId: string,
  patch: {
    monitoringEnabled?: boolean;
    environment?: Project["environment"];
    scanMode?: Project["scanMode"];
    files?: string[];
  },
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

export async function fetchGithubRepositoryFiles(input: {
  fullName: string;
  branch: string;
  query: string;
}): Promise<GithubFileSearch> {
  const params = new URLSearchParams({
    fullName: input.fullName,
    branch: input.branch,
  });
  if (input.query) params.set("q", input.query);
  const data = await apiGet<unknown>(`/api/github/repository-files?${params.toString()}`);
  return githubFileSearchSchema.parse(data);
}
