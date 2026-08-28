import { filterActionableUpdates } from "@/services/intelligence/visibility";

export type UpdateIntelComponent = {
  name: string;
  ecosystem: string;
  version: string;
  latestVersion?: string | null;
  versionStatus?: string;
  recommendationKind?: string | null;
  hasSecurityFix?: boolean;
  cves?: string[];
  sourceFile?: string;
  repository?: string;
  tier?: string | null;
  declaredDirect?: boolean;
  directParent?: string | null;
  priority?: string | null;
  impact?: string | null;
  environment?: string | null;
};

export type UpdateIntelCounts = {
  updatesAvailable: number;
  securityUpdates: number;
  highPriority: number;
  reviewRequired: number;
  lowRisk: number;
  p1Updates: number;
};

export function recommendationKindFromComponent(item: UpdateIntelComponent): string | null {
  if (item.recommendationKind) return item.recommendationKind;
  if ((item.cves?.length ?? 0) > 0) return "update_urgent";
  if (item.versionStatus === "major") return "review";
  if (item.hasSecurityFix) return "update";
  if (item.versionStatus === "patch") return "update";
  if (item.versionStatus === "minor") return "wait";
  return null;
}

export function summarizeUpdateIntel(components: UpdateIntelComponent[]): UpdateIntelCounts {
  const outdated = filterActionableUpdates(components);
  return {
    updatesAvailable: outdated.length,
    securityUpdates: outdated.filter(
      (item) => item.hasSecurityFix || (item.cves?.length ?? 0) > 0,
    ).length,
    highPriority: outdated.filter((item) => {
      const kind = recommendationKindFromComponent(item);
      return kind === "update" || kind === "update_urgent";
    }).length,
    reviewRequired: outdated.filter((item) => recommendationKindFromComponent(item) === "review").length,
    lowRisk: outdated.filter((item) => recommendationKindFromComponent(item) === "wait").length,
    p1Updates: outdated.filter((item) => item.priority === "P1").length,
  };
}

const KIND_ORDER: Record<string, number> = { update_urgent: 0, update: 1, review: 2, wait: 3 };
const PRIORITY_ORDER: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

export function sortAvailableUpdates<T extends UpdateIntelComponent>(components: T[]): T[] {
  return [...filterActionableUpdates(components)].sort((left, right) => {
    const priority =
      (PRIORITY_ORDER[left.priority ?? ""] ?? 9) - (PRIORITY_ORDER[right.priority ?? ""] ?? 9);
    if (priority !== 0) return priority;
    const kind =
      (KIND_ORDER[recommendationKindFromComponent(left) ?? ""] ?? 9) -
      (KIND_ORDER[recommendationKindFromComponent(right) ?? ""] ?? 9);
    if (kind !== 0) return kind;
    return left.name.localeCompare(right.name);
  });
}
