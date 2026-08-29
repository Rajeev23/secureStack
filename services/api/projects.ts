import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { ProjectRepository, ProjectRow } from "@/server/supabase/types";
import { DomainError } from "@/lib/errors";
import { parseProjectMonitoring, type ProjectEnvironment, type ScanMode } from "@/services/monitoring/schedule";
import { primaryRepositories } from "@/services/api/project-repositories";
import { normalizeName } from "@/lib/company/names";
import { requireCompanyContext } from "@/services/api/company";
import { normalizeWatchPaths } from "@/services/scanner/watch-paths";

export type ProjectPublic = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  repositories: ProjectRepository[];
  status: ProjectRow["status"];
  monitoringEnabled: boolean;
  environment: ProjectEnvironment;
  scanMode: ScanMode;
  files: string[];
  scanScopeConfigured: boolean;
  createdAt: string;
  updatedAt: string;
};

function toProjectPublic(row: ProjectRow): ProjectPublic {
  const monitoring = parseProjectMonitoring(row.monitoring);
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    repositories: primaryRepositories(row.repositories),
    status: row.status,
    monitoringEnabled: monitoring.enabled,
    environment: monitoring.environment,
    scanMode: monitoring.scanMode,
    files: monitoring.files,
    scanScopeConfigured: monitoring.scanScopeConfigured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(userId: string): Promise<ProjectPublic[]> {
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new DomainError(error.message, 500);
  return ((data ?? []) as ProjectRow[]).map(toProjectPublic);
}

export async function getProject(userId: string, projectId: string): Promise<ProjectPublic> {
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new DomainError(error.message, 500);
  if (!data) throw new DomainError("Project not found.", 404);
  return toProjectPublic(data as ProjectRow);
}

export async function createProject(
  userId: string,
  input: { name: string; description?: string; environment?: ProjectEnvironment },
): Promise<ProjectPublic> {
  const name = normalizeName(input.name);
  if (!name) throw new DomainError("Project name is required.", 400);

  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .insert({
      company_id: companyId,
      name,
      description: input.description?.trim() || null,
      repositories: [],
      monitoring: {
        enabled: true,
        environment: input.environment ?? "unknown",
        scanMode: "full",
        files: [],
        scanScopeConfigured: false,
      },
      status: "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new DomainError(error?.message ?? "Unable to create project.", 500);
  }

  return toProjectPublic(data as ProjectRow);
}

export async function attachProjectRepositories(
  userId: string,
  projectId: string,
  repositories: ProjectRepository[],
  scope?: { scanMode: ScanMode; files?: string[] },
): Promise<ProjectPublic> {
  if (repositories.length !== 1) {
    throw new DomainError("Connect one GitHub repository.", 400);
  }
  if (scope?.scanMode === "selected" && normalizeWatchPaths(scope.files).length === 0) {
    throw new DomainError("Select at least one file to monitor.", 400);
  }

  const current = await getProject(userId, projectId);
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data: row, error: currentError } = await admin
    .from("projects")
    .select("monitoring")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .single();
  if (currentError || !row) {
    throw new DomainError(currentError?.message ?? "Project not found.", 404);
  }

  const previous = parseProjectMonitoring((row as ProjectRow).monitoring);
  const sameRepo = current.repositories[0]?.repositoryId === repositories[0]?.repositoryId;
  const monitoring = parseProjectMonitoring({
    ...previous,
    ...(scope
      ? {
          scanMode: scope.scanMode,
          files: scope.files ?? previous.files,
          scanScopeConfigured: true,
        }
      : sameRepo
        ? {}
        : { scanMode: "full", files: [], scanScopeConfigured: false }),
  });

  const { data, error } = await admin
    .from("projects")
    .update({ repositories: primaryRepositories(repositories), monitoring })
    .eq("id", projectId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DomainError(error?.message ?? "Unable to connect the repository.", 500);
  }

  return toProjectPublic(data as ProjectRow);
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const project = await getProject(userId, projectId);
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("projects").delete().eq("id", project.id).eq("company_id", companyId);

  if (error) {
    throw new DomainError(error.message, 500);
  }
}

export async function updateProjectMonitoring(
  userId: string,
  projectId: string,
  patch: {
    enabled?: boolean;
    environment?: ProjectEnvironment;
    scanMode?: ScanMode;
    files?: string[];
    scanScopeConfigured?: boolean;
  },
): Promise<ProjectPublic> {
  const project = await getProject(userId, projectId);
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data: current, error: currentError } = await admin
    .from("projects")
    .select("monitoring")
    .eq("id", project.id)
    .eq("company_id", companyId)
    .single();
  if (currentError || !current) {
    throw new DomainError(currentError?.message ?? "Project not found.", 404);
  }
  const previous = parseProjectMonitoring((current as ProjectRow).monitoring);
  const nextFiles = patch.files !== undefined ? normalizeWatchPaths(patch.files) : previous.files;
  const nextMode = patch.scanMode ?? previous.scanMode;
  if (nextMode === "selected" && nextFiles.length === 0) {
    throw new DomainError("Select at least one file to monitor.", 400);
  }
  const monitoring = parseProjectMonitoring({
    ...previous,
    ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
    ...(patch.environment !== undefined ? { environment: patch.environment } : {}),
    scanMode: nextMode,
    files: nextFiles,
    scanScopeConfigured:
      patch.scanScopeConfigured ??
      (patch.scanMode !== undefined || patch.files !== undefined ? true : previous.scanScopeConfigured),
  });
  const { data, error } = await admin
    .from("projects")
    .update({ monitoring })
    .eq("id", projectId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DomainError(error?.message ?? "Unable to update monitoring.", 500);
  }
  return toProjectPublic(data as ProjectRow);
}
