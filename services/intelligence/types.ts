import type { Ecosystem } from "@/services/scanner/types";
import type { FindingSeverity, FindingType } from "@/server/supabase/types";
import type { ChangeSummary } from "@/services/intelligence/changelog";
import type { ImpactFields } from "@/services/intelligence/impact";
import type { DependencyTier } from "@/services/scanner/tiers";

export type VersionStatus = "up_to_date" | "patch" | "minor" | "major" | "unknown";
export type EolStatus = "supported" | "approaching" | "eol" | "unknown";
export type RecommendationKind = "update_urgent" | "update" | "review" | "wait";

export type EnrichedComponent = {
  name: string;
  ecosystem: string;
  version: string;
  sourceFile: string;
  repository: string;
  tier: DependencyTier;
  upstreamRepo: string | null;
  directParent: string | null;
  latestVersion: string | null;
  versionStatus: VersionStatus;
  cves: string[];
  eolStatus: EolStatus;
  eolDate: string | null;
  recommendedVersion: string | null;
  recommendation: string | null;
  recommendationKind: RecommendationKind | null;
  hasSecurityFix: boolean;
  releasedAt: string | null;
  releaseUrl: string | null;
  changeSummary: ChangeSummary;
} & ImpactFields;

export type IntelligenceFindingDraft = {
  componentName: string;
  ecosystem: string;
  currentVersion: string;
  recommendedVersion: string | null;
  findingType: FindingType;
  severity: FindingSeverity;
  externalReference: string | null;
  recommendation: string;
};

export type RegistryLookup = {
  ecosystem: Ecosystem | string;
  name: string;
  version: string;
  upstreamRepo?: string | null;
};
