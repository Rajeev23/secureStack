import type { CompanyMonitoring, ProjectMonitoring } from "@/services/monitoring/schedule";

export type CompanyStatus = "active" | "inactive" | "suspended";
export type UserRole = "ADMIN" | "MEMBER";
export type ProjectStatus = "active" | "archived";
export type ScanStatus = "pending" | "running" | "completed" | "failed";
export type FindingType = "SECURITY" | "UPDATE" | "EOL";
export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type FindingStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "IGNORED"
  | "ACCEPTED_RISK";

export type GithubConnection = {
  provider: "github";
  accountLogin: string;
  accountId: number;
  encryptedAccessToken: string;
  tokenType: string;
  scope: string;
  connectedAt: string;
};

export type ProjectRepository = {
  provider: "github";
  repositoryId: string;
  fullName: string;
  url: string;
  branch: string;
};

export type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  github_connection: GithubConnection | null;
  monitoring: CompanyMonitoring | null;
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ProjectRow = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  repositories: ProjectRepository[];
  monitoring: ProjectMonitoring | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyPublic = {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  githubConnected: boolean;
  githubAccountLogin: string | null;
  scanIntervalHours: number;
  alertsEnabled: boolean;
  slackConfigured: boolean;
  notifyEmail: string | null;
  digestMode: "off" | "daily" | "weekly";
  createdAt: string;
  updatedAt: string;
};

export type ScanRow = {
  id: string;
  project_id: string;
  source: string;
  status: ScanStatus;
  started_at: string | null;
  completed_at: string | null;
  components_found: number;
  findings_found: number;
  result_snapshot: ScanSnapshot | null;
  error: string | null;
  created_at: string;
};

export type ScanCoverage = {
  uniquePackages: number;
  checkedPackages: number;
  truncated: boolean;
};

export type ScanSnapshot = {
  repositories: Array<{
    fullName: string;
    branch: string;
    files: string[];
  }>;
  components: Array<{
    name: string;
    ecosystem: string;
    version: string;
    sourceFile: string;
    repository: string;
    tier?: string;
    upstreamRepo?: string | null;
    directParent?: string | null;
    latestVersion?: string | null;
    versionStatus?: string;
    cves?: string[];
    eolStatus?: string;
    eolDate?: string | null;
    recommendedVersion?: string | null;
    recommendation?: string | null;
    recommendationKind?: string | null;
    hasSecurityFix?: boolean;
    releasedAt?: string | null;
    releaseUrl?: string | null;
    changeSummary?: {
      security: string[];
      bugfix: string[];
      performance: string[];
      breaking: string[];
      other: string[];
    };
    applicationName?: string;
    environment?: string;
    impact?: string;
    impactReasons?: string[];
    priority?: string | null;
    priorityScore?: number;
    priorityWhy?: string;
    slaDays?: number | null;
    slaLabel?: string | null;
  }>;
  changes?: {
    added: Array<{ name: string; ecosystem: string; version: string }>;
    removed: Array<{ name: string; ecosystem: string; version: string }>;
    updated: Array<{ name: string; ecosystem: string; from: string; to: string; breaking: boolean }>;
    newCves: string[];
    resolvedCves: string[];
    alerts: Array<{ kind: string; severity: string; summary: string }>;
  };
  coverage?: ScanCoverage;
};

export type FindingRow = {
  id: string;
  project_id: string;
  component_name: string;
  ecosystem: string | null;
  current_version: string | null;
  recommended_version: string | null;
  finding_type: FindingType;
  severity: FindingSeverity;
  external_reference: string | null;
  status: FindingStatus;
  recommendation: string | null;
  first_detected_at: string;
  last_detected_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};
