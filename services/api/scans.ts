import { DomainError } from "@/lib/errors";
import { diffSnapshots } from "@/services/intelligence/changes";
import { enrichComponents } from "@/services/intelligence/enrich";
import { parseSbomDocument } from "@/services/intelligence/sbom";
import {
  isDigestDue,
  isProjectScanDue,
  MAX_SCHEDULED_SCANS_PER_TICK,
  parseCompanyMonitoring,
  parseProjectMonitoring,
} from "@/services/monitoring/schedule";
import { notifyForScan, notificationsForScan } from "@/services/monitoring/scan-events";
import { dispatchNotifications, dashboardDeepLink } from "@/services/monitoring/dispatch";
import { primaryRepositories } from "@/services/api/project-repositories";
import { scanGitHubRepository } from "@/services/scanner/scan-repository";
import type { ScanSnapshot as ParsedScanSnapshot } from "@/services/scanner/types";
import { scanListSnapshot } from "@/services/scanner/summary";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { CompanyRow, ProjectRow, ScanRow, ScanSnapshot } from "@/server/supabase/types";
import { markDigestSent } from "@/services/api/company";
import { syncFindingsForProject } from "@/services/api/findings";
import { getCompanyGitHubToken, getCompanyGitHubTokenForCompany } from "@/services/api/github";
import { getProject, listProjects } from "@/services/api/projects";
import { requireCompanyContext } from "@/services/api/company";

export type ScanPublic = {
  id: string;
  projectId: string;
  source: string;
  status: ScanRow["status"];
  startedAt: string | null;
  completedAt: string | null;
  componentsFound: number;
  findingsFound: number;
  error: string | null;
  createdAt: string;
  snapshot: ScanSnapshot | null;
};

const SCAN_LIST_SELECT =
  "id, project_id, source, status, started_at, completed_at, components_found, findings_found, error, created_at";

function toScanPublic(row: ScanRow): ScanPublic {
  return {
    id: row.id,
    projectId: row.project_id,
    source: row.source,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    componentsFound: row.components_found,
    findingsFound: row.findings_found,
    error: row.error,
    createdAt: row.created_at,
    snapshot: row.result_snapshot,
  };
}

function toScanListPublic(row: ScanRow): ScanPublic {
  const scan = toScanPublic(row);
  return { ...scan, snapshot: scanListSnapshot(scan.snapshot) };
}

export async function listScansForProject(userId: string, projectId: string): Promise<ScanPublic[]> {
  await getProject(userId, projectId);
  return listScansByProjectId(projectId);
}

async function listScansByProjectId(projectId: string): Promise<ScanPublic[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("scans")
    .select(SCAN_LIST_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new DomainError(error.message, 500);
  return ((data ?? []) as ScanRow[]).map((row) => toScanListPublic({ ...row, result_snapshot: null }));
}

export async function getScan(userId: string, scanId: string): Promise<ScanPublic> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("scans").select("*").eq("id", scanId).maybeSingle();
  if (error) throw new DomainError(error.message, 500);
  if (!data) throw new DomainError("Scan not found.", 404);
  await getProject(userId, (data as ScanRow).project_id);
  return toScanPublic(data as ScanRow);
}

export async function createScan(
  userId: string,
  projectId: string,
  source = "github",
): Promise<ScanPublic> {
  const project = await getProject(userId, projectId);
  return insertScan(project.id, project.repositories.length, source);
}

async function insertScan(projectId: string, repositoryCount: number, source: string): Promise<ScanPublic> {
  if (source !== "sbom" && repositoryCount === 0) {
    throw new DomainError("Connect a GitHub repository before scanning.", 400);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("scans")
    .insert({
      project_id: projectId,
      source,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new DomainError(error?.message ?? "Unable to start scan.", 500);
  }

  return toScanPublic(data as ScanRow);
}

export async function runScan(userId: string, scanId: string): Promise<ScanPublic> {
  const scan = await getScan(userId, scanId);
  const project = await getProject(userId, scan.projectId);
  const token = await getCompanyGitHubToken(userId);
  return executeScan({
    scanId,
    projectId: project.id,
    projectName: project.name,
    companyId: project.companyId,
    environment: project.environment,
    repositories: project.repositories,
    token,
  });
}

export async function runSbomScan(userId: string, projectId: string, document: unknown): Promise<ScanPublic> {
  const project = await getProject(userId, projectId);
  const parsed = parseSbomDocument(document);
  if (parsed.components.length === 0) {
    throw new DomainError("No packages found in the SBOM.", 400);
  }
  const created = await insertScan(project.id, project.repositories.length, "sbom");
  let token: string | undefined;
  try {
    token = await getCompanyGitHubToken(userId);
  } catch {
    token = undefined;
  }
  const snapshot: ParsedScanSnapshot = {
    repositories: [{ fullName: "sbom", branch: "sbom", files: ["sbom.json"] }],
    components: parsed.components.map((component) => ({
      name: component.name,
      ecosystem: component.ecosystem,
      version: component.version,
      sourceFile: component.sourceFile,
      repository: project.name,
      tier: component.tier,
      upstreamRepo: component.upstreamRepo,
      directParent: component.directParent,
    })),
  };
  return executeScan({
    scanId: created.id,
    projectId: project.id,
    projectName: project.name,
    companyId: project.companyId,
    environment: project.environment,
    repositories: project.repositories,
    token,
    snapshot,
  });
}

async function previousCompletedSnapshot(projectId: string, currentScanId: string): Promise<ScanSnapshot | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("scans")
    .select("result_snapshot")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .neq("id", currentScanId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new DomainError(error.message, 500);
  return ((data as { result_snapshot?: ScanSnapshot | null } | null)?.result_snapshot ?? null);
}

async function executeScan(input: {
  scanId: string;
  projectId: string;
  projectName: string;
  companyId: string;
  environment: ReturnType<typeof parseProjectMonitoring>["environment"];
  repositories: Array<{ fullName: string; branch: string }>;
  token?: string;
  snapshot?: ParsedScanSnapshot;
}): Promise<ScanPublic> {
  const admin = createSupabaseAdminClient();

  await admin
    .from("scans")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", input.scanId);

  try {
    const snapshot: ParsedScanSnapshot = input.snapshot ?? { repositories: [], components: [] };

    if (!input.snapshot) {
      if (!input.token) {
        throw new DomainError("GitHub is not connected.", 409);
      }
      for (const repo of primaryRepositories(input.repositories)) {
        const result = await scanGitHubRepository(input.token, repo.fullName, repo.branch || "main");
        snapshot.repositories.push({
          fullName: repo.fullName,
          branch: repo.branch || "main",
          files: result.files,
        });
        snapshot.components.push(
          ...result.components.map((component) => ({
            name: component.name,
            ecosystem: component.ecosystem,
            version: component.version,
            sourceFile: component.sourceFile,
            repository: repo.fullName,
            tier: component.tier,
            upstreamRepo: component.upstreamRepo,
            directParent: component.directParent,
          })),
        );
      }
    }

    const { data, error } = await admin
      .from("scans")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        components_found: snapshot.components.length,
        result_snapshot: snapshot,
        error: null,
      })
      .eq("id", input.scanId)
      .select("*")
      .single();

    if (error || !data) {
      throw new DomainError(error?.message ?? "Unable to save scan.", 500);
    }

    try {
      const intel = await enrichComponents(snapshot.components, {
        githubToken: input.token,
        environment: input.environment,
        applicationName: input.projectName,
      });
      const previous = await previousCompletedSnapshot(input.projectId, input.scanId);
      const changes = diffSnapshots(previous, { components: intel.components });
      const openFindings = await syncFindingsForProject(input.projectId, intel.findings);
      const { data: enrichedRow, error: enrichError } = await admin
        .from("scans")
        .update({
          findings_found: openFindings,
          result_snapshot: {
            repositories: snapshot.repositories,
            components: intel.components,
            changes,
            coverage: intel.coverage,
          },
        })
        .eq("id", input.scanId)
        .select("*")
        .single();

      const completed = !enrichError && enrichedRow ? toScanPublic(enrichedRow as ScanRow) : toScanPublic(data as ScanRow);
      await notifyScanOutcome({
        companyId: input.companyId,
        projectId: input.projectId,
        projectName: input.projectName,
        status: completed.status,
        error: completed.error,
        changes,
        findings: intel.findings,
      });
      return completed;
    } catch (intelError) {
      console.error("Scan intelligence failed; inventory was still saved.", intelError);
    }

    return toScanPublic(data as ScanRow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read repository.";
    const { data } = await admin
      .from("scans")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: message,
      })
      .eq("id", input.scanId)
      .select("*")
      .single();

    await notifyScanOutcome({
      companyId: input.companyId,
      projectId: input.projectId,
      projectName: input.projectName,
      status: "failed",
      error: message,
    });

    if (data) return toScanPublic(data as ScanRow);
    throw new DomainError(message, 502);
  }
}

async function notifyScanOutcome(input: {
  companyId: string;
  projectId: string;
  projectName: string;
  status: string;
  error?: string | null;
  changes?: ScanSnapshot["changes"];
  findings?: Parameters<typeof notificationsForScan>[0]["findings"];
}) {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("companies").select("monitoring").eq("id", input.companyId).maybeSingle();
    const monitoring = parseCompanyMonitoring((data as { monitoring?: unknown } | null)?.monitoring);
    const events = notificationsForScan({
      projectId: input.projectId,
      projectName: input.projectName,
      status: input.status,
      error: input.error,
      changes: input.changes,
      findings: input.findings,
    });
    await notifyForScan(monitoring, events);
  } catch (error) {
    console.error("Scan notification failed.", error);
  }
}

export async function listLatestScans(userId: string, projectIds: string[]): Promise<ScanPublic[]> {
  if (projectIds.length === 0) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("scans")
    .select(SCAN_LIST_SELECT)
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new DomainError(error.message, 500);
  return ((data ?? []) as ScanRow[]).map((row) => toScanListPublic({ ...row, result_snapshot: null }));
}

export type CompanyScanPublic = ScanPublic & { projectName: string };

export async function listCompanyScans(userId: string): Promise<CompanyScanPublic[]> {
  const projects = await listProjects(userId);
  const scans = await listLatestScans(
    userId,
    projects.map((project) => project.id),
  );
  const names = new Map(projects.map((project) => [project.id, project.name]));
  return scans.map((scan) => ({
    ...scan,
    projectName: names.get(scan.projectId) ?? "Project",
    snapshot: null,
  }));
}

export async function getLatestCompletedScan(
  userId: string,
  projectId: string,
): Promise<ScanPublic | null> {
  await getProject(userId, projectId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("scans")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new DomainError(error.message, 500);
  return data ? toScanPublic(data as ScanRow) : null;
}

export async function listLatestCompletedScansForProjects(
  userId: string,
  projectIds: string[],
): Promise<Map<string, ScanPublic>> {
  const result = new Map<string, ScanPublic>();
  if (projectIds.length === 0) return result;

  const { companyId } = await requireCompanyContext(userId);
  const admin = createSupabaseAdminClient();
  const { data: owned, error: ownedError } = await admin
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .in("id", projectIds);

  if (ownedError) throw new DomainError(ownedError.message, 500);
  const ownedIds = ((owned ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (ownedIds.length === 0) return result;

  const { data: meta, error: metaError } = await admin
    .from("scans")
    .select("id, project_id, completed_at")
    .in("project_id", ownedIds)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(Math.min(500, Math.max(ownedIds.length * 8, ownedIds.length)));

  if (metaError) throw new DomainError(metaError.message, 500);

  const latestIdByProject = new Map<string, string>();
  for (const row of (meta ?? []) as Array<{ id: string; project_id: string }>) {
    if (!latestIdByProject.has(row.project_id)) {
      latestIdByProject.set(row.project_id, row.id);
    }
  }
  const ids = [...latestIdByProject.values()];
  if (ids.length === 0) return result;

  const { data: full, error: fullError } = await admin.from("scans").select("*").in("id", ids);
  if (fullError) throw new DomainError(fullError.message, 500);
  for (const row of (full ?? []) as ScanRow[]) {
    result.set(row.project_id, toScanPublic(row));
  }
  return result;
}

export type ScheduledScanResult = {
  projectId: string;
  projectName: string;
  status: string;
  scanId?: string;
  error?: string;
};

export type ScheduledScanTick = {
  scanned: ScheduledScanResult[];
  skipped: number;
  remaining: number;
};

export async function runDueScheduledScans(options: { companyId?: string } = {}): Promise<ScheduledScanTick> {
  const admin = createSupabaseAdminClient();
  let projectQuery = admin.from("projects").select("*").eq("status", "active");
  if (options.companyId) {
    projectQuery = projectQuery.eq("company_id", options.companyId);
  }
  const { data: projectRows, error: projectError } = await projectQuery;
  if (projectError) throw new DomainError(projectError.message, 500);

  const projects = (projectRows ?? []) as ProjectRow[];
  if (projects.length === 0) {
    return { scanned: [], skipped: 0, remaining: 0 };
  }
  const companyIds = [...new Set(projects.map((project) => project.company_id))];
  const { data: companyRows, error: companyError } = await admin
    .from("companies")
    .select("*")
    .in("id", companyIds);
  if (companyError) throw new DomainError(companyError.message, 500);

  const companies = new Map(((companyRows ?? []) as CompanyRow[]).map((row) => [row.id, row]));
  const due: ProjectRow[] = [];

  for (const project of projects) {
    const company = companies.get(project.company_id);
    const intervalHours = parseCompanyMonitoring(company?.monitoring).scanIntervalHours;
    const enabled = parseProjectMonitoring(project.monitoring).enabled;
    const scans = await listScansByProjectId(project.id);
    const latest = scans[0]
      ? { status: scans[0].status, createdAt: scans[0].createdAt, startedAt: scans[0].startedAt }
      : null;
    const repositories = primaryRepositories(
      Array.isArray(project.repositories) ? project.repositories : [],
    );
    if (
      isProjectScanDue({
        hasRepositories: repositories.length > 0,
        projectEnabled: enabled,
        intervalHours,
        latest,
      })
    ) {
      due.push(project);
    }
  }

  const batch = due.slice(0, MAX_SCHEDULED_SCANS_PER_TICK);
  const scanned: ScheduledScanResult[] = [];

  for (const project of batch) {
    const started = Date.now();
    const repositories = primaryRepositories(
      Array.isArray(project.repositories) ? project.repositories : [],
    );
    try {
      const token = await getCompanyGitHubTokenForCompany(project.company_id);
      const created = await insertScan(project.id, repositories.length, "schedule");
      const monitoring = parseProjectMonitoring(project.monitoring);
      const result = await executeScan({
        scanId: created.id,
        projectId: project.id,
        projectName: project.name,
        companyId: project.company_id,
        environment: monitoring.environment,
        repositories,
        token,
      });
      scanned.push({
        projectId: project.id,
        projectName: project.name,
        status: result.status,
        scanId: result.id,
        error: result.error ?? undefined,
      });
      console.info(
        JSON.stringify({
          event: "cron.scan",
          projectId: project.id,
          scanId: result.id,
          status: result.status,
          durationMs: Date.now() - started,
          components: result.componentsFound,
          findings: result.findingsFound,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to run scheduled scan.";
      scanned.push({
        projectId: project.id,
        projectName: project.name,
        status: "failed",
        error: message,
      });
      console.error(
        JSON.stringify({
          event: "cron.scan",
          projectId: project.id,
          status: "failed",
          durationMs: Date.now() - started,
          error: message,
        }),
      );
    }
  }

  await sendDueDigests(companies, scanned);

  return {
    scanned,
    skipped: projects.length - due.length,
    remaining: Math.max(0, due.length - batch.length),
  };
}

/** Sends digest Slack/email when companies.monitoring.digestMode is due. */
async function sendDueDigests(
  companies: Map<string, CompanyRow>,
  scanned: ScheduledScanResult[],
) {
  const now = new Date();
  for (const company of companies.values()) {
    const monitoring = parseCompanyMonitoring(company.monitoring);
    if (!isDigestDue(monitoring, now)) continue;
    const failed = scanned.filter((item) => item.status === "failed").length;
    const completed = scanned.filter((item) => item.status === "completed").length;
    await dispatchNotifications(monitoring, {
      title: `SecureStack ${monitoring.digestMode} digest`,
      body: `${completed} scan(s) completed and ${failed} failed in this window. Open the dashboard for P1 updates and what’s changed.`,
      url: dashboardDeepLink(),
      severity: failed ? "high" : "info",
    });
    await markDigestSent(company.id, now);
  }
}
