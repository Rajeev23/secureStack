import type { FindingSeverity } from "@/server/supabase/types";
import {
  changeSummaryHasNotes,
  type ChangeSummary,
} from "@/services/intelligence/changelog";
import type { EolStatus, RecommendationKind, VersionStatus } from "@/services/intelligence/types";

export function securityRecommendation(input: {
  name: string;
  current: string;
  cve: string;
  fixed: string | null;
  latest: string | null;
}): string {
  const target = input.fixed ?? input.latest;
  if (target) {
    return `Upgrade ${input.name} from ${input.current} to ${target} to address ${input.cve}.`;
  }
  return `${input.name} ${input.current} is affected by ${input.cve}. Check the advisory for a fixed release.`;
}

export function recommendationKindFor(input: {
  versionStatus: VersionStatus;
  hasSecurityFix: boolean;
  hasBreaking: boolean;
  cveCount: number;
  hasChangeNotes?: boolean;
}): RecommendationKind | null {
  if (input.versionStatus === "up_to_date" || input.versionStatus === "unknown") return null;
  if (input.cveCount > 0) return "update_urgent";
  if (input.versionStatus === "major" || input.hasBreaking) return "review";
  if (input.hasSecurityFix) return "update";
  if (input.versionStatus === "patch") return "update";
  if (input.versionStatus === "minor" && input.hasChangeNotes) return "update";
  return "wait";
}

export function updateIntelligenceRecommendation(input: {
  name: string;
  current: string;
  latest: string;
  kind: RecommendationKind;
  versionStatus: VersionStatus;
  hasSecurityFix: boolean;
  hasBreaking: boolean;
  changes: ChangeSummary;
}): string {
  const gap = `${input.name} from ${input.current} to ${input.latest}`;
  if (input.kind === "update_urgent") {
    return `UPDATE URGENTLY: ${input.name} ${input.current} has known CVEs. Upgrade to ${input.latest}.`;
  }
  if (input.kind === "review") {
    const why = input.hasBreaking ? "potential breaking changes" : "a major version change";
    return `REVIEW before updating ${gap} (${why}). Validate compatibility first.`;
  }
  if (input.kind === "update") {
    if (input.hasSecurityFix) {
      return `UPDATE recommended: ${gap} includes security fixes and no known breaking changes.`;
    }
    return `UPDATE recommended: ${gap} (${input.versionStatus} update, no known security or breaking changes).`;
  }
  const notes = changeSummaryHasNotes(input.changes) ? " See what changed before you decide." : "";
  return `Update is not urgent: ${gap} is a ${input.versionStatus} release with no known security issue.${notes}`;
}

export function updateRecommendation(input: {
  name: string;
  current: string;
  latest: string;
  status: VersionStatus;
}): string {
  const kind =
    input.status === "major" ? "major" : input.status === "minor" ? "minor" : "patch";
  return `Upgrade ${input.name} from ${input.current} to ${input.latest} (${kind} update).`;
}

export function eolRecommendation(input: {
  name: string;
  current: string;
  status: EolStatus;
  eolDate: string | null;
  latest: string | null;
}): string {
  const when = input.eolDate ? ` on ${input.eolDate}` : "";
  const upgrade = input.latest ? ` Upgrade to ${input.latest}.` : " Upgrade to a supported release.";
  if (input.status === "eol") {
    return `${input.name} ${input.current} is end of life${when}.${upgrade}`;
  }
  return `${input.name} ${input.current} is approaching end of life${when}.${upgrade}`;
}

export function updateSeverity(status: VersionStatus): FindingSeverity {
  if (status === "major") return "MEDIUM";
  if (status === "minor") return "LOW";
  return "INFO";
}
