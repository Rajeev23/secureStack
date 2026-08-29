import { DomainError } from "@/lib/errors";
import { findingIdentity } from "@/services/intelligence/identity";
import { draftFindingsFromComponents } from "@/services/intelligence/findings-from-snapshot";
import type { IntelligenceFindingDraft } from "@/services/intelligence/types";
import type { FindingSeverity, FindingStatus, FindingType } from "@/server/supabase/types";
import { getProject, listProjects } from "@/services/api/projects";
import { listLatestCompletedScansForProjects, type ScanPublic } from "@/services/api/scans";

export type FindingPublic = {
  id: string;
  projectId: string;
  projectName?: string;
  componentName: string;
  ecosystem: string | null;
  currentVersion: string | null;
  recommendedVersion: string | null;
  findingType: FindingType;
  severity: FindingSeverity;
  externalReference: string | null;
  status: FindingStatus;
  recommendation: string | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

function findingPublicId(projectId: string, draft: IntelligenceFindingDraft): string {
  return findingIdentity({
    componentName: draft.componentName,
    ecosystem: draft.ecosystem,
    findingType: draft.findingType,
    externalReference: draft.externalReference,
  })
    .split("\0")
    .map((part) => encodeURIComponent(part))
    .concat(encodeURIComponent(projectId))
    .join(".");
}

function toFindingPublic(
  projectId: string,
  projectName: string | undefined,
  draft: IntelligenceFindingDraft,
  detectedAt: string,
): FindingPublic {
  return {
    id: findingPublicId(projectId, draft),
    projectId,
    projectName,
    componentName: draft.componentName,
    ecosystem: draft.ecosystem,
    currentVersion: draft.currentVersion,
    recommendedVersion: draft.recommendedVersion,
    findingType: draft.findingType,
    severity: draft.severity,
    externalReference: draft.externalReference,
    status: "OPEN",
    recommendation: draft.recommendation,
    firstDetectedAt: detectedAt,
    lastDetectedAt: detectedAt,
    resolvedAt: null,
    createdAt: detectedAt,
    updatedAt: detectedAt,
  };
}

function findingsFromScan(
  scan: ScanPublic,
  projectName: string | undefined,
): FindingPublic[] {
  const detectedAt = scan.completedAt ?? scan.createdAt;
  return draftFindingsFromComponents(scan.snapshot?.components ?? []).map((draft) =>
    toFindingPublic(scan.projectId, projectName, draft, detectedAt),
  );
}

export async function listFindingsForProject(userId: string, projectId: string): Promise<FindingPublic[]> {
  const project = await getProject(userId, projectId);
  const latest = await listLatestCompletedScansForProjects(userId, [projectId]);
  const scan = latest.get(projectId);
  if (!scan) return [];
  return sortFindings(findingsFromScan(scan, project.name)).slice(0, 200);
}

export async function listOpenFindingsForCompany(userId: string): Promise<FindingPublic[]> {
  const projects = await listProjects(userId);
  if (projects.length === 0) return [];
  const byId = new Map(projects.map((project) => [project.id, project.name]));
  const latest = await listLatestCompletedScansForProjects(
    userId,
    projects.map((project) => project.id),
  );
  const findings: FindingPublic[] = [];
  for (const scan of latest.values()) {
    findings.push(...findingsFromScan(scan, byId.get(scan.projectId)));
  }
  return sortFindings(findings).slice(0, 400);
}

export async function updateFindingStatus(
  userId: string,
  findingId: string,
  status: FindingStatus,
): Promise<FindingPublic> {
  void userId;
  void findingId;
  void status;
  throw new DomainError("Finding status is not stored yet.", 501);
}

function sortFindings(findings: FindingPublic[]): FindingPublic[] {
  return [...findings].sort((a, b) => {
    const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severity !== 0) return severity;
    return a.componentName.localeCompare(b.componentName);
  });
}
