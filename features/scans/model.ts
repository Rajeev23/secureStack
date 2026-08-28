import { z } from "zod";

export const scanComponentSchema = z.object({
  name: z.string(),
  ecosystem: z.string(),
  version: z.string(),
  sourceFile: z.string(),
  repository: z.string(),
  tier: z.enum(["infra", "direct", "transitive"]).optional(),
  upstreamRepo: z.string().nullable().optional(),
  directParent: z.string().nullable().optional(),
  latestVersion: z.string().nullable().optional(),
  versionStatus: z.string().optional(),
  cves: z.array(z.string()).optional(),
  eolStatus: z.string().optional(),
  eolDate: z.string().nullable().optional(),
  recommendedVersion: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
  recommendationKind: z.string().nullable().optional(),
  hasSecurityFix: z.boolean().optional(),
  releasedAt: z.string().nullable().optional(),
  releaseUrl: z.string().nullable().optional(),
  changeSummary: z
    .object({
      security: z.array(z.string()).default([]),
      bugfix: z.array(z.string()).default([]),
      performance: z.array(z.string()).default([]),
      breaking: z.array(z.string()).default([]),
      other: z.array(z.string()).default([]),
    })
    .optional(),
  applicationName: z.string().optional(),
  environment: z.string().optional(),
  impact: z.string().optional(),
  impactReasons: z.array(z.string()).optional(),
  priority: z.string().nullable().optional(),
  priorityScore: z.number().optional(),
  priorityWhy: z.string().optional(),
  slaDays: z.number().nullable().optional(),
  slaLabel: z.string().nullable().optional(),
});

export const scanSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  source: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  componentsFound: z.number(),
  findingsFound: z.number(),
  error: z.string().nullable(),
  createdAt: z.string(),
  snapshot: z
    .object({
      repositories: z.array(
        z.object({
          fullName: z.string(),
          branch: z.string(),
          files: z.array(z.string()),
        }),
      ),
      components: z.array(scanComponentSchema).default([]),
      coverage: z
        .object({
          uniquePackages: z.number(),
          checkedPackages: z.number(),
          truncated: z.boolean(),
        })
        .optional(),
      changes: z
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
        .optional(),
    })
    .passthrough()
    .nullable(),
});

export type Scan = z.infer<typeof scanSchema>;
export type ScanComponent = z.infer<typeof scanComponentSchema>;
