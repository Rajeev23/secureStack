import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { mergeCoverage } from "@/services/intelligence/coverage";
import { withProjectImpact } from "@/services/intelligence/impact";
import { filterInventoryRows, inventoryMeta, parseInventoryScope } from "@/services/intelligence/inventory-query";
import { withInferredTier } from "@/services/intelligence/visibility";
import { isUpdateAvailable } from "@/services/intelligence/version";
import { paginate, parsePageQuery } from "@/lib/pagination";
import { snapshotCoverage } from "@/services/scanner/summary";
import { listProjects } from "@/services/api/projects";
import { listLatestCompletedScansForProjects } from "@/services/api/scans";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const search = new URL(request.url).searchParams;
    const { includeTransitive, outdatedOnly } = parseInventoryScope(search);
    const { offset, limit } = parsePageQuery(search);
    const projects = await listProjects(session.userId);
    const scansByProject = await listLatestCompletedScansForProjects(
      session.userId,
      projects.map((project) => project.id),
    );
    const rows = [];

    for (const project of projects) {
      const scan = scansByProject.get(project.id);
      for (const component of scan?.snapshot?.components ?? []) {
        if (outdatedOnly && !isUpdateAvailable(component.versionStatus)) continue;
        rows.push({
          ...withInferredTier(
            withProjectImpact(component, {
              environment: project.environment,
              applicationName: project.name,
            }),
          ),
          projectId: project.id,
          projectName: project.name,
          scanId: scan?.id ?? null,
        });
      }
    }

    const visible = filterInventoryRows(rows, includeTransitive);
    const page = paginate(visible, offset, limit);
    const meta = inventoryMeta(rows);
    return NextResponse.json({
      components: page.items,
      total: page.total,
      offset: page.offset,
      limit: page.limit,
      hasMore: page.hasMore,
      coverage: mergeCoverage([...scansByProject.values()].map((scan) => snapshotCoverage(scan.snapshot))),
      tiers: meta.tiers,
      transitiveGroups: outdatedOnly ? meta.transitiveGroups : [],
    });
  } catch (error) {
    return jsonError(error);
  }
}
