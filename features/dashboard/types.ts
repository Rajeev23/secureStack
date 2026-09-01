import type { Finding } from "@/features/findings/model";
import type { EnrichedComponent } from "@/services/intelligence/types";

export type DashboardChange = {
  projectId: string;
  projectName: string;
  kind: string;
  severity: string;
  summary: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
};

export type DashboardScan = {
  id: string;
  projectId: string;
  projectName: string;
  source?: string;
  status: string;
  completedAt: string | null;
  componentsFound: number;
  findingsFound?: number;
};

export type DashboardTrend = {
  at: string;
  findingsFound: number;
  componentsFound: number;
  projectName: string;
};

export type DashboardOverviewResponse = {
  stats: DashboardStat[];
  findings: Finding[];
  updates: Array<EnrichedComponent & { projectId: string; projectName: string }>;
  scans: DashboardScan[];
  changes: DashboardChange[];
  trends?: DashboardTrend[];
  priority?: { P1: number; P2: number; P3: number; P4: number };
};
