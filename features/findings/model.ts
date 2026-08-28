import { z } from "zod";

export const findingSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string().optional(),
  componentName: z.string(),
  ecosystem: z.string().nullable(),
  currentVersion: z.string().nullable(),
  recommendedVersion: z.string().nullable(),
  findingType: z.enum(["SECURITY", "UPDATE", "EOL"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
  externalReference: z.string().nullable(),
  status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "IGNORED", "ACCEPTED_RISK"]),
  recommendation: z.string().nullable(),
  firstDetectedAt: z.string(),
  lastDetectedAt: z.string(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Finding = z.infer<typeof findingSchema>;
