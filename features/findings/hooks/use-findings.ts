import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCompanyFindings,
  fetchProjectFindings,
  updateFindingStatus,
} from "@/features/findings/api/client";
import type { Finding } from "@/features/findings/model";

export function useCompanyFindings() {
  return useQuery({
    queryKey: ["findings"],
    queryFn: fetchCompanyFindings,
  });
}

export function useProjectFindings(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "findings"],
    queryFn: () => fetchProjectFindings(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function useUpdateFindingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ findingId, status }: { findingId: string; status: Finding["status"] }) =>
      updateFindingStatus(findingId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["findings"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
