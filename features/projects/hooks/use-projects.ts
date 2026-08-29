import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectProjectRepositories,
  createProject,
  deleteProject,
  fetchGithubRepositories,
  fetchGithubRepositoryFiles,
  fetchProject,
  fetchProjects,
  updateProjectMonitoring,
} from "@/features/projects/api/client";
import type { Project } from "@/features/projects/model";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

export function useProjectNameMap(): Record<string, string> {
  const { data } = useProjects();
  return useMemo(() => {
    const names: Record<string, string> = {};
    for (const project of data ?? []) {
      names[project.id] = project.name;
    }
    return names;
  }, [data]);
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useConnectRepositories(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      repositories: Project["repositories"];
      scanMode?: Project["scanMode"];
      files?: string[];
    }) => connectProjectRepositories(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateProjectMonitoring(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: {
      monitoringEnabled?: boolean;
      environment?: Project["environment"];
      scanMode?: Project["scanMode"];
      files?: string[];
    }) => updateProjectMonitoring(projectId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previous = queryClient.getQueryData<Project[]>(["projects"]);
      queryClient.setQueryData<Project[]>(["projects"], (current) =>
        current?.filter((project) => project.id !== projectId),
      );
      return { previous };
    },
    onError: (_error, _projectId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["findings"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["scans"] });
    },
  });
}

export function useGithubRepositories(enabled: boolean) {
  return useQuery({
    queryKey: ["github", "repositories"],
    queryFn: fetchGithubRepositories,
    enabled,
    retry: false,
  });
}

export function useGithubRepositoryFiles(
  input: { fullName: string; branch: string; query: string } | null,
) {
  return useQuery({
    queryKey: ["github", "repository-files", input?.fullName, input?.branch, input?.query],
    queryFn: () => fetchGithubRepositoryFiles(input as { fullName: string; branch: string; query: string }),
    enabled: Boolean(input?.fullName && input?.branch),
    staleTime: 30_000,
    retry: false,
  });
}
