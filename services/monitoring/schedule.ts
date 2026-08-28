export type CompanyMonitoring = {
  scanIntervalHours: number;
  alertsEnabled: boolean;
  slackWebhookUrl: string | null;
  notifyEmail: string | null;
  digestMode: DigestMode;
  lastDigestAt: string | null;
};

export type DigestMode = "off" | "daily" | "weekly";

export type ProjectEnvironment = "production" | "staging" | "development" | "unknown";

export type ProjectMonitoring = {
  enabled: boolean;
  environment: ProjectEnvironment;
};

export const DEFAULT_COMPANY_MONITORING: CompanyMonitoring = {
  scanIntervalHours: 24,
  alertsEnabled: true,
  slackWebhookUrl: null,
  notifyEmail: null,
  digestMode: "off",
  lastDigestAt: null,
};

export const DEFAULT_PROJECT_MONITORING: ProjectMonitoring = {
  enabled: true,
  environment: "unknown",
};

const ALLOWED_INTERVALS = new Set([0, 6, 12, 24, 48, 168]);
const ENVIRONMENTS = new Set<ProjectEnvironment>(["production", "staging", "development", "unknown"]);
const DIGEST_MODES = new Set<DigestMode>(["off", "daily", "weekly"]);

function asEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function asSlackWebhook(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (!parsed.hostname.endsWith("hooks.slack.com") && parsed.hostname !== "hooks.slack.com") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function parseCompanyMonitoring(value: unknown): CompanyMonitoring {
  if (!value || typeof value !== "object") return { ...DEFAULT_COMPANY_MONITORING };
  const record = value as Record<string, unknown>;
  const hours = Number(record.scanIntervalHours);
  const digest = typeof record.digestMode === "string" ? record.digestMode : "";
  return {
    scanIntervalHours: ALLOWED_INTERVALS.has(hours) ? hours : DEFAULT_COMPANY_MONITORING.scanIntervalHours,
    alertsEnabled: record.alertsEnabled !== false,
    slackWebhookUrl: asSlackWebhook(record.slackWebhookUrl),
    notifyEmail: asEmail(record.notifyEmail),
    digestMode: DIGEST_MODES.has(digest as DigestMode) ? (digest as DigestMode) : "off",
    lastDigestAt: typeof record.lastDigestAt === "string" ? record.lastDigestAt : null,
  };
}

export function parseProjectMonitoring(value: unknown): ProjectMonitoring {
  if (!value || typeof value !== "object") return { ...DEFAULT_PROJECT_MONITORING };
  const record = value as Record<string, unknown>;
  const environment = typeof record.environment === "string" ? record.environment : "unknown";
  return {
    enabled: record.enabled !== false,
    environment: ENVIRONMENTS.has(environment as ProjectEnvironment)
      ? (environment as ProjectEnvironment)
      : "unknown",
  };
}

export type ScanRecency = {
  status: string;
  createdAt: string;
  startedAt: string | null;
};

const STUCK_AFTER_MS = 45 * 60 * 1000;

export function isProjectScanDue(input: {
  hasRepositories: boolean;
  projectEnabled: boolean;
  intervalHours: number;
  latest: ScanRecency | null;
  now?: Date;
}): boolean {
  if (!input.hasRepositories || !input.projectEnabled) return false;
  if (input.intervalHours <= 0) return false;

  const now = input.now ?? new Date();
  if (!input.latest) return true;

  if (input.latest.status === "running" || input.latest.status === "pending") {
    const started = Date.parse(input.latest.startedAt ?? input.latest.createdAt);
    return Number.isFinite(started) && now.getTime() - started > STUCK_AFTER_MS;
  }

  const last = Date.parse(input.latest.createdAt);
  if (!Number.isFinite(last)) return true;
  const intervalMs = input.intervalHours * 60 * 60 * 1000;
  const retryMs = input.latest.status === "failed" ? Math.min(intervalMs, 60 * 60 * 1000) : intervalMs;
  return now.getTime() - last >= retryMs;
}

export function isDigestDue(monitoring: CompanyMonitoring, now = new Date()): boolean {
  if (monitoring.digestMode === "off") return false;
  if (!monitoring.lastDigestAt) return true;
  const last = Date.parse(monitoring.lastDigestAt);
  if (!Number.isFinite(last)) return true;
  const hours = monitoring.digestMode === "daily" ? 20 : 144;
  return now.getTime() - last >= hours * 60 * 60 * 1000;
}

export const MAX_SCHEDULED_SCANS_PER_TICK = 3;
