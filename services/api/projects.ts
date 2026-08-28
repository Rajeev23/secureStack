import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { ProjectRepository, ProjectRow } from "@/server/supabase/types";
import { DomainError } from "@/lib/errors";
import { parseProjectMonitoring, type ProjectEnvironment } from "@/services/monitoring/schedule";
import { primaryRepositories } from "@/services/api/project-repositories";
import { normalizeName } from "@/lib/company/names";
import { requireCompanyContext } from "@/services/api/company";

export type ProjectPublic = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  repositories: ProjectRepository[];
  status: ProjectRow["status"];
  monitoringEnabled: boolean;
  environment: ProjectEnvironment;
  createdAt: string;
  updatedAt: string;
};

function toProjectPublic(row: ProjectRow): ProjectPublic {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    repositories: primaryRepositories(row.repositories),
    status: row.status,
    monitoringEnabled: parseProjectMonitoring(row.monitoring).enabled,
    environment: parseProjectMonitoring(row.monitoring).environment,
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
): Promise<ProjectPublic> {
  if (repositories.length !== 1) {
    throw new DomainError("Connect one GitHub repository.", 400);
  }

  await getProject(userId, projectId);
  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .update({ repositories: primaryRepositories(repositories) })
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
  patch: { enabled?: boolean; environment?: ProjectEnvironment },
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
  const monitoring = parseProjectMonitoring({
    ...parseProjectMonitoring((current as ProjectRow).monitoring),
    ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
    ...(patch.environment !== undefined ? { environment: patch.environment } : {}),
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
