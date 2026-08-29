import { useQuery } from "@tanstack/react-query";
import { fetchCompanyFindings, fetchProjectFindings } from "@/features/findings/api/client";

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

