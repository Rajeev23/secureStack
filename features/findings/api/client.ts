import { z } from "zod";
import { apiGet, apiPatch } from "@/lib/api/client";
import { findingSchema, type Finding } from "@/features/findings/model";

const findingsResponseSchema = z.object({
  findings: z.array(findingSchema),
});

export async function fetchCompanyFindings(): Promise<Finding[]> {
  const data = await apiGet<unknown>("/api/findings");
  return findingsResponseSchema.parse(data).findings;
}

export async function fetchProjectFindings(projectId: string): Promise<Finding[]> {
  const data = await apiGet<unknown>(`/api/projects/${projectId}/findings`);
  return findingsResponseSchema.parse(data).findings;
}

export async function updateFindingStatus(findingId: string, status: Finding["status"]): Promise<Finding> {
  const data = await apiPatch<unknown>(`/api/findings/${findingId}`, { status });
  return z.object({ finding: findingSchema }).parse(data).finding;
}
