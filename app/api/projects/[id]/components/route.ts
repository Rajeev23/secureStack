import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { filterInventoryRows, inventoryMeta, parseInventoryScope } from "@/services/intelligence/inventory-query";
import { withInferredTier } from "@/services/intelligence/visibility";
import { withProjectImpact } from "@/services/intelligence/impact";
import { paginate, parsePageQuery } from "@/lib/pagination";
import { snapshotCoverage } from "@/services/scanner/summary";
import { recommendationKindFromComponent, sortAvailableUpdates } from "@/services/intelligence/summarize";
import { getProject } from "@/services/api/projects";
import { getLatestCompletedScan } from "@/services/api/scans";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;

  try {
    const search = new URL(request.url).searchParams;
    const { includeTransitive } = parseInventoryScope(search);
    const { offset, limit } = parsePageQuery(search);
    const project = await getProject(session.userId, id);
    const scan = await getLatestCompletedScan(session.userId, id);
    const components = (scan?.snapshot?.components ?? []).map((component) =>
      withInferredTier(
        withProjectImpact(component, {
          environment: project.environment,
          applicationName: project.name,
        }),
      ),
    );
    const visible = filterInventoryRows(components, includeTransitive);
    const page = paginate(visible, offset, limit);
    const meta = inventoryMeta(components);
    return NextResponse.json({
      components: page.items,
      availableUpdates: sortAvailableUpdates(components)
        .slice(0, 100)
        .map((component) => ({
          ...component,
          recommendationKind: recommendationKindFromComponent(component),
        })),
      transitiveGroups: meta.transitiveGroups,
      tiers: meta.tiers,
      total: page.total,
      offset: page.offset,
      limit: page.limit,
      hasMore: page.hasMore,
      coverage: snapshotCoverage(scan?.snapshot ?? null),
      changes: scan?.snapshot?.changes ?? null,
      scan: scan
        ? {
            id: scan.id,
            status: scan.status,
            completedAt: scan.completedAt,
            componentsFound: scan.componentsFound,
          }
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
