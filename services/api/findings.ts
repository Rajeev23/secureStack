import { DomainError } from "@/lib/errors";
import { findingIdentity } from "@/services/intelligence/identity";
import { mapPool } from "@/services/intelligence/http";
import type { IntelligenceFindingDraft } from "@/services/intelligence/types";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { FindingRow, FindingStatus } from "@/server/supabase/types";
import { getProject, listProjects } from "@/services/api/projects";

export type FindingPublic = {
  id: string;
  projectId: string;
  projectName?: string;
  componentName: string;
  ecosystem: string | null;
  currentVersion: string | null;
  recommendedVersion: string | null;
  findingType: FindingRow["finding_type"];
  severity: FindingRow["severity"];
  externalReference: string | null;
  status: FindingStatus;
  recommendation: string | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toFindingPublic(row: FindingRow, projectName?: string): FindingPublic {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName,
    componentName: row.component_name,
    ecosystem: row.ecosystem,
    currentVersion: row.current_version,
    recommendedVersion: row.recommended_version,
    findingType: row.finding_type,
    severity: row.severity,
    externalReference: row.external_reference,
    status: row.status,
    recommendation: row.recommendation,
    firstDetectedAt: row.first_detected_at,
    lastDetectedAt: row.last_detected_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SEVERITY_RANK: Record<FindingRow["severity"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export async function listFindingsForProject(userId: string, projectId: string): Promise<FindingPublic[]> {
  const project = await getProject(userId, projectId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("findings")
    .select("*")
    .eq("project_id", projectId)
    .order("last_detected_at", { ascending: false })
    .limit(200);

  if (error) throw new DomainError(error.message, 500);
  return sortFindings(((data ?? []) as FindingRow[]).map((row) => toFindingPublic(row, project.name)));
}

export async function listFindingHistoryForCompany(userId: string, limit = 200): Promise<FindingPublic[]> {
  const projects = await listProjects(userId);
  if (projects.length === 0) return [];
  const byId = new Map(projects.map((project) => [project.id, project.name]));
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("findings")
    .select("*")
    .in(
      "project_id",
      projects.map((project) => project.id),
    )
    .order("last_detected_at", { ascending: false })
    .limit(limit);

  if (error) throw new DomainError(error.message, 500);
  return ((data ?? []) as FindingRow[]).map((row) => toFindingPublic(row, byId.get(row.project_id)));
}

export async function listOpenFindingsForCompany(userId: string): Promise<FindingPublic[]> {
  const projects = await listProjects(userId);
  if (projects.length === 0) return [];
  const byId = new Map(projects.map((project) => [project.id, project.name]));
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("findings")
    .select("*")
    .in(
      "project_id",
      projects.map((project) => project.id),
    )
    .in("status", ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"])
    .order("last_detected_at", { ascending: false })
    .limit(400);

  if (error) throw new DomainError(error.message, 500);
  return sortFindings(
    ((data ?? []) as FindingRow[]).map((row) => toFindingPublic(row, byId.get(row.project_id))),
  );
}

export async function syncFindingsForProject(
  projectId: string,
  drafts: IntelligenceFindingDraft[],
): Promise<number> {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin.from("findings").select("*").eq("project_id", projectId).limit(1000);
  if (error) throw new DomainError(error.message, 500);

  const existing = (data ?? []) as FindingRow[];
  const existingByKey = new Map(
    existing.map((row) => [
      findingIdentity({
        componentName: row.component_name,
        ecosystem: row.ecosystem,
        findingType: row.finding_type,
        externalReference: row.external_reference,
      }),
      row,
    ]),
  );
  const seen = new Set<string>();
  let openCount = 0;
  const writes: Array<() => Promise<unknown>> = [];

  for (const draft of drafts) {
    const key = findingIdentity({
      componentName: draft.componentName,
      ecosystem: draft.ecosystem,
      findingType: draft.findingType,
      externalReference: draft.externalReference,
    });
    seen.add(key);
    const previous = existingByKey.get(key);
    const reopen = previous?.status === "RESOLVED";
    const keepClosed =
      previous &&
      (previous.status === "IGNORED" || previous.status === "ACCEPTED_RISK");
    const nextStatus: FindingStatus = keepClosed
      ? previous.status
      : reopen || !previous
        ? "OPEN"
        : previous.status;

    if (nextStatus === "OPEN" || nextStatus === "ACKNOWLEDGED" || nextStatus === "IN_PROGRESS") {
      openCount += 1;
    }

    if (previous) {
      writes.push(async () => {
        await admin
          .from("findings")
          .update({
            current_version: draft.currentVersion,
            recommended_version: draft.recommendedVersion,
            severity: draft.severity,
            recommendation: draft.recommendation,
            status: nextStatus,
            last_detected_at: now,
            resolved_at: nextStatus === "OPEN" && reopen ? null : previous.resolved_at,
          })
          .eq("id", previous.id);
      });
      continue;
    }

    writes.push(async () => {
      await admin.from("findings").insert({
        project_id: projectId,
        component_name: draft.componentName,
        ecosystem: draft.ecosystem,
        current_version: draft.currentVersion,
        recommended_version: draft.recommendedVersion,
        finding_type: draft.findingType,
        severity: draft.severity,
        external_reference: draft.externalReference,
        status: "OPEN",
        recommendation: draft.recommendation,
        first_detected_at: now,
        last_detected_at: now,
      });
    });
  }

  await mapPool(writes, 8, (write) => write());

  const resolves: Array<() => Promise<unknown>> = [];
  for (const row of existing) {
    const key = findingIdentity({
      componentName: row.component_name,
      ecosystem: row.ecosystem,
      findingType: row.finding_type,
      externalReference: row.external_reference,
    });
    if (seen.has(key)) continue;
    if (row.status === "IGNORED" || row.status === "ACCEPTED_RISK" || row.status === "RESOLVED") continue;
    resolves.push(async () => {
      await admin
        .from("findings")
        .update({
          status: "RESOLVED",
          resolved_at: now,
        })
        .eq("id", row.id);
    });
  }
  await mapPool(resolves, 8, (write) => write());

  return openCount;
}

export async function updateFindingStatus(
  userId: string,
  findingId: string,
  status: FindingStatus,
): Promise<FindingPublic> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("findings").select("*").eq("id", findingId).maybeSingle();
  if (error) throw new DomainError(error.message, 500);
  if (!data) throw new DomainError("Finding not found.", 404);

  const row = data as FindingRow;
  const project = await getProject(userId, row.project_id);
  const now = new Date().toISOString();
  const resolvedAt = status === "RESOLVED" || status === "IGNORED" || status === "ACCEPTED_RISK" ? now : null;

  const { data: updated, error: updateError } = await admin
    .from("findings")
    .update({
      status,
      resolved_at: status === "OPEN" || status === "ACKNOWLEDGED" || status === "IN_PROGRESS" ? null : resolvedAt,
    })
    .eq("id", findingId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new DomainError(updateError?.message ?? "Unable to update finding.", 500);
  }
  return toFindingPublic(updated as FindingRow, project.name);
}

function sortFindings(findings: FindingPublic[]): FindingPublic[] {
  return [...findings].sort((a, b) => {
    const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severity !== 0) return severity;
    return a.componentName.localeCompare(b.componentName);
  });
}
