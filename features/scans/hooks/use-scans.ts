import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCompanyScans,
  fetchInventory,
  fetchProjectComponents,
  fetchProjectScans,
  importProjectSbom,
  startProjectScan,
} from "@/features/scans/api/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function useProjectScans(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "scans"],
    queryFn: () => fetchProjectScans(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function useProjectComponents(
  projectId: string | undefined,
  pageSize = DEFAULT_PAGE_SIZE,
  includeTransitive = false,
) {
  return useQuery({
    queryKey: ["projects", projectId, "components", pageSize, includeTransitive],
    queryFn: () =>
      fetchProjectComponents(projectId as string, { offset: 0, limit: pageSize, includeTransitive }),
    enabled: Boolean(projectId),
  });
}

export function useInventory(pageSize = DEFAULT_PAGE_SIZE, includeTransitive = false) {
  return useQuery({
    queryKey: ["inventory", pageSize, includeTransitive],
    queryFn: () => fetchInventory({ offset: 0, limit: pageSize, includeTransitive }),
  });
}

export function useAvailableUpdates(pageSize = DEFAULT_PAGE_SIZE, includeTransitive = false) {
  return useQuery({
    queryKey: ["inventory", "updates", pageSize, includeTransitive],
    queryFn: () => fetchInventory({ offset: 0, limit: pageSize, outdated: true, includeTransitive }),
  });
}

export function useCompanyScans() {
  return useQuery({
    queryKey: ["scans"],
    queryFn: fetchCompanyScans,
  });
}

export function useImportSbom(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: unknown) => importProjectSbom(projectId, document),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["findings"] });
      void queryClient.invalidateQueries({ queryKey: ["scans"] });
    },
  });
}

export function useStartScan(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startProjectScan(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["findings"] });
      void queryClient.invalidateQueries({ queryKey: ["scans"] });
    },
  });
}
