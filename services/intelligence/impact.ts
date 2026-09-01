import { isUpdateAvailable } from "@/services/intelligence/version";

export type ProjectEnvironment = "production" | "staging" | "development" | "unknown";

export type ImpactLevel = "critical" | "high" | "medium" | "low" | "none";
export type UpdatePriority = "P1" | "P2" | "P3" | "P4";

export type ImpactContext = {
  environment: ProjectEnvironment;
  applicationName: string;
  now?: Date;
};

export type ImpactFields = {
  applicationName: string;
  environment: ProjectEnvironment;
  impact: ImpactLevel;
  impactReasons: string[];
  priority: UpdatePriority | null;
  priorityScore: number;
  priorityWhy: string;
  slaDays: number | null;
  slaLabel: string | null;
};

export type ImpactInput = {
  versionStatus?: string | null;
  recommendationKind?: string | null;
  hasSecurityFix?: boolean;
  cves?: string[] | null;
  changeSummary?: { breaking?: string[]; security?: string[] } | null;
  releasedAt?: string | null;
};

const SEVERITY_WEIGHT = {
  urgent: 40,
  security: 30,
  major: 18,
  minor: 8,
  patch: 5,
} as const;

const ENV_BONUS: Record<ProjectEnvironment, number> = {
  production: 20,
  staging: 8,
  development: 0,
  unknown: 5,
};

export function scoreUpdateImpact(input: ImpactInput, context: ImpactContext): ImpactFields {
  const cves = input.cves ?? [];
  const hasCve = cves.length > 0;
  const hasSecurity = hasCve || Boolean(input.hasSecurityFix) || (input.changeSummary?.security?.length ?? 0) > 0;
  const hasBreaking = (input.changeSummary?.breaking?.length ?? 0) > 0;
  const kind = input.recommendationKind ?? null;
  const outdated = isUpdateAvailable(input.versionStatus);
  const env = context.environment;
  const production = env === "production";
  const reasons: string[] = [];

  let score = 0;
  if (kind === "update_urgent" || hasCve) {
    score += SEVERITY_WEIGHT.urgent;
    reasons.push(hasCve ? "Known CVE on the installed version" : "Security update available");
  } else if (hasSecurity) {
    score += SEVERITY_WEIGHT.security;
    reasons.push("Security fix in the new release");
  } else if (input.versionStatus === "major" || hasBreaking) {
    score += SEVERITY_WEIGHT.major;
  } else if (input.versionStatus === "minor") {
    score += SEVERITY_WEIGHT.minor;
  } else if (input.versionStatus === "patch") {
    score += SEVERITY_WEIGHT.patch;
  }

  score += ENV_BONUS[env];
  if (production) reasons.push("Used in production");
  else if (env === "staging") reasons.push("Used in staging");

  if (hasBreaking) {
    score += 12;
    reasons.push("Breaking changes in the new release");
  }

  const ageDays = daysSince(input.releasedAt, context.now);
  if (ageDays != null) {
    if (ageDays >= 30) {
      score += 15;
      reasons.push("Fix has been available for 30+ days");
    } else if (ageDays >= 14) {
      score += 8;
      reasons.push("Fix has been available for 14+ days");
    } else if (ageDays >= 7) {
      score += 4;
    }
  }

  const impact = impactLevel({ production, hasCve, hasSecurity, hasBreaking, kind, outdated, env });
  const priority = outdated ? priorityFromScore({ score, kind, hasCve, production, impact }) : null;
  const slaDays = slaFor({ impact, production, hasSecurity, outdated });

  return {
    applicationName: context.applicationName,
    environment: env,
    impact,
    impactReasons: reasons,
    priority,
    priorityScore: score,
    priorityWhy: priorityWhy(priority, reasons, score),
    slaDays,
    slaLabel: slaDays ? `Update within ${slaDays} days` : null,
  };
}

function impactLevel(input: {
  production: boolean;
  hasCve: boolean;
  hasSecurity: boolean;
  hasBreaking: boolean;
  kind: string | null;
  outdated: boolean;
  env: ProjectEnvironment;
}): ImpactLevel {
  if (!input.outdated && !input.hasCve) return "none";
  if (input.production && (input.hasCve || input.kind === "update_urgent")) return "critical";
  if (input.production && (input.hasSecurity || input.hasBreaking)) return "high";
  if ((input.env === "staging" && input.hasCve) || input.kind === "update_urgent") return "high";
  if (input.production || input.hasSecurity || input.kind === "review") return "medium";
  if (input.env === "development" && !input.hasSecurity) return "low";
  return input.outdated ? "low" : "none";
}

function priorityFromScore(input: {
  score: number;
  kind: string | null;
  hasCve: boolean;
  production: boolean;
  impact: ImpactLevel;
}): UpdatePriority {
  if (input.score >= 70 || (input.hasCve && input.production) || input.impact === "critical") return "P1";
  if (input.score >= 45 || input.kind === "update_urgent" || input.impact === "high") return "P2";
  if (input.score >= 25 || input.kind === "review" || input.impact === "medium") return "P3";
  return "P4";
}

function slaFor(input: {
  impact: ImpactLevel;
  production: boolean;
  hasSecurity: boolean;
  outdated: boolean;
}): number | null {
  if (!input.outdated) return null;
  if (input.impact === "critical" || (input.production && input.hasSecurity)) return 7;
  if (input.impact === "high") return 14;
  return null;
}

function priorityWhy(priority: UpdatePriority | null, reasons: string[], score: number): string {
  if (!priority) return "No update is waiting.";
  const detail = reasons.length ? reasons.join(". ") : "Version drift only.";
  return `Why is this ${priority}? Score ${score}. ${detail}.`;
}

function daysSince(releasedAt: string | null | undefined, now?: Date): number | null {
  if (!releasedAt) return null;
  const then = Date.parse(releasedAt);
  if (!Number.isFinite(then)) return null;
  const start = now ?? new Date();
  return Math.max(0, Math.floor((start.getTime() - then) / 86_400_000));
}

export function withProjectImpact<T extends ImpactInput>(
  component: T,
  context: ImpactContext,
): T & ImpactFields {
  return { ...component, ...scoreUpdateImpact(component, context) };
}
