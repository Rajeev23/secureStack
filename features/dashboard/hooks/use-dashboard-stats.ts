import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Finding } from "@/features/findings/model";
import type { Project } from "@/features/projects/model";
import type { ScanComponent } from "@/features/scans/model";

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
  projects: Project[];
  findings: Finding[];
  updates: Array<ScanComponent & { projectId: string; projectName: string }>;
  scans: DashboardScan[];
  changes: DashboardChange[];
  trends?: DashboardTrend[];
  priority?: { P1: number; P2: number; P3: number; P4: number };
  resolvedLast7Days?: number;
  meanTimeToResolveHours?: number | null;
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiGet<DashboardOverviewResponse>("/api/dashboard/stats"),
  });
}

export function useDashboardStats() {
  const query = useDashboardOverview();
  return {
    ...query,
    data: query.data?.stats,
  };
}
