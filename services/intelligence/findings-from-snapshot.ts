import { findingIdentity } from "@/services/intelligence/identity";
import {
  eolRecommendation,
  securityRecommendation,
  updateSeverity,
} from "@/services/intelligence/recommend";
import type { IntelligenceFindingDraft, VersionStatus } from "@/services/intelligence/types";
import { isOutdated } from "@/services/intelligence/version";
import { isDefaultInventoryRow } from "@/services/intelligence/visibility";
import type { FindingSeverity } from "@/services/intelligence/types";

export type FindingSourceComponent = {
  name: string;
  ecosystem: string;
  version: string;
  tier?: string | null;
  latestVersion?: string | null;
  versionStatus?: string | null;
  cves?: string[] | null;
  eolStatus?: string | null;
  eolDate?: string | null;
  recommendedVersion?: string | null;
  recommendation?: string | null;
  recommendationKind?: string | null;
  hasSecurityFix?: boolean;
  impact?: string | null;
};

function securitySeverity(impact: string | null | undefined): FindingSeverity {
  if (impact === "critical") return "CRITICAL";
  if (impact === "high") return "HIGH";
  if (impact === "medium") return "MEDIUM";
  if (impact === "low") return "LOW";
  return "HIGH";
}

/** Rebuild finding drafts from a scan snapshot. Does not read or write `findings`. */
export function draftFindingsFromComponents(
  components: FindingSourceComponent[],
): IntelligenceFindingDraft[] {
  const drafts: IntelligenceFindingDraft[] = [];
  const seen = new Set<string>();

  const push = (draft: IntelligenceFindingDraft) => {
    const key = findingIdentity({
      componentName: draft.componentName,
      ecosystem: draft.ecosystem,
      findingType: draft.findingType,
      externalReference: draft.externalReference,
    });
    if (seen.has(key)) return;
    seen.add(key);
    drafts.push(draft);
  };

  for (const component of components) {
    const cves = component.cves ?? [];
    const latest = component.latestVersion ?? null;
    const recommended = component.recommendedVersion ?? latest;
    const versionStatus = (component.versionStatus ?? "unknown") as VersionStatus;
    const tier = component.tier ?? null;

    for (const cve of cves) {
      push({
        componentName: component.name,
        ecosystem: component.ecosystem,
        currentVersion: component.version,
        recommendedVersion: recommended,
        findingType: "SECURITY",
        severity: securitySeverity(component.impact),
        externalReference: cve,
        recommendation: securityRecommendation({
          name: component.name,
          current: component.version,
          cve,
          fixed: recommended,
          latest,
        }),
      });
    }

    if (
      cves.length === 0 &&
      latest &&
      isOutdated(component.version, latest) &&
      component.recommendation &&
      isDefaultInventoryRow({ ...component, cves: component.cves ?? [] })
    ) {
      push({
        componentName: component.name,
        ecosystem: component.ecosystem,
        currentVersion: component.version,
        recommendedVersion: latest,
        findingType: "UPDATE",
        severity: updateSeverity(versionStatus),
        externalReference: component.recommendationKind ?? null,
        recommendation: component.recommendation,
      });
    }

    const eolStatus = component.eolStatus;
    if ((eolStatus === "eol" || eolStatus === "approaching") && tier !== "transitive") {
      push({
        componentName: component.name,
        ecosystem: component.ecosystem,
        currentVersion: component.version,
        recommendedVersion: recommended,
        findingType: "EOL",
        severity: eolStatus === "eol" ? "HIGH" : "MEDIUM",
        externalReference: component.eolDate ?? null,
        recommendation: eolRecommendation({
          name: component.name,
          current: component.version,
          status: eolStatus,
          eolDate: component.eolDate ?? null,
          latest,
        }),
      });
    }
  }

  return drafts;
}
