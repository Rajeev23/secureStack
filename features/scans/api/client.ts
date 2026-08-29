import { z } from "zod";
import { apiGet, apiPost } from "@/lib/api/client";
import { scanComponentSchema, scanSchema, type Scan } from "@/features/scans/model";

const coverageSchema = z.object({
  uniquePackages: z.number(),
  checkedPackages: z.number(),
  truncated: z.boolean(),
});

const tiersSchema = z.object({
  infra: z.number(),
  direct: z.number(),
  transitive: z.number(),
  transitiveSecurity: z.number(),
  hiddenTransitive: z.number(),
});

const transitiveGroupSchema = z.object({
  parent: z.string(),
  count: z.number(),
  securityCount: z.number(),
  items: z.array(scanComponentSchema).default([]),
});

const scanResponseSchema = z.object({
  scan: scanSchema,
  error: z.string().optional(),
});

const scansResponseSchema = z.object({
  scans: z.array(scanSchema),
});

const changesSchema = z
  .object({
    added: z.array(z.object({ name: z.string(), ecosystem: z.string(), version: z.string() })),
    removed: z.array(z.object({ name: z.string(), ecosystem: z.string(), version: z.string() })),
    updated: z.array(
      z.object({
        name: z.string(),
        ecosystem: z.string(),
        from: z.string(),
        to: z.string(),
        breaking: z.boolean(),
      }),
    ),
    newCves: z.array(z.string()),
    resolvedCves: z.array(z.string()),
    alerts: z.array(
      z.object({
        kind: z.string(),
        severity: z.string(),
        summary: z.string(),
      }),
    ),
  })
  .nullable();

const projectComponentsSchema = z.object({
  components: z.array(scanComponentSchema),
  availableUpdates: z.array(scanComponentSchema).default([]),
  transitiveGroups: z.array(transitiveGroupSchema).default([]),
  tiers: tiersSchema.nullable().optional(),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
  coverage: coverageSchema.nullable(),
  changes: changesSchema,
  scan: z
    .object({
      id: z.string(),
      status: z.string(),
      completedAt: z.string().nullable(),
      componentsFound: z.number(),
    })
    .nullable(),
});

const inventorySchema = z.object({
  components: z.array(
    scanComponentSchema.extend({
      projectId: z.string(),
      projectName: z.string(),
      scanId: z.string().nullable(),
    }),
  ),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
  coverage: coverageSchema.nullable(),
  tiers: tiersSchema.nullable().optional(),
  transitiveGroups: z.array(transitiveGroupSchema).default([]),
});

export type InventoryComponent = z.infer<typeof inventorySchema>["components"][number];
export type InventoryPage = z.infer<typeof inventorySchema>;
export type ProjectComponentsPage = z.infer<typeof projectComponentsSchema>;
export type IntelligenceCoverage = z.infer<typeof coverageSchema>;

export async function startProjectScan(projectId: string): Promise<Scan> {
  const data = await apiPost<unknown>(`/api/projects/${projectId}/scans`, {});
  return scanResponseSchema.parse(data).scan;
}

export async function importProjectSbom(projectId: string, document: unknown): Promise<Scan> {
  const data = await apiPost<unknown>(`/api/projects/${projectId}/sbom`, { document });
  return scanResponseSchema.parse(data).scan;
}

export async function fetchProjectScans(projectId: string): Promise<Scan[]> {
  const data = await apiGet<unknown>(`/api/projects/${projectId}/scans`);
  return scansResponseSchema.parse(data).scans;
}

export async function fetchProjectComponents(
  projectId: string,
  params: { offset?: number; limit?: number; includeTransitive?: boolean; name?: string } = {},
): Promise<ProjectComponentsPage> {
  const search = new URLSearchParams();
  if (params.offset != null) search.set("offset", String(params.offset));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.includeTransitive) search.set("transitive", "1");
  if (params.name) search.set("name", params.name);
  const suffix = search.size ? `?${search.toString()}` : "";
  const data = await apiGet<unknown>(`/api/projects/${projectId}/components${suffix}`);
  return projectComponentsSchema.parse(data);
}

const companyScanSchema = scanSchema.extend({
  projectName: z.string(),
});

export async function fetchInventory(
  params: { offset?: number; limit?: number; outdated?: boolean; includeTransitive?: boolean } = {},
): Promise<InventoryPage> {
  const search = new URLSearchParams();
  if (params.offset != null) search.set("offset", String(params.offset));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.outdated) search.set("outdated", "1");
  if (params.includeTransitive) search.set("transitive", "1");
  const suffix = search.size ? `?${search.toString()}` : "";
  const data = await apiGet<unknown>(`/api/inventory${suffix}`);
  return inventorySchema.parse(data);
}

export async function fetchCompanyScans(): Promise<Array<Scan & { projectName: string }>> {
  const data = await apiGet<unknown>("/api/scans");
  return z.object({ scans: z.array(companyScanSchema) }).parse(data).scans;
}
