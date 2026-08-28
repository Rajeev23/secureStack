import { inferTier, type DependencyTier } from "@/services/scanner/tiers";
import { isUpdateAvailable } from "@/services/intelligence/version";

export type VisibilityComponent = {
  name: string;
  ecosystem?: string | null;
  sourceFile?: string | null;
  fromLockfile?: boolean;
  declaredDirect?: boolean;
  tier?: string | null;
  cves?: string[];
  hasSecurityFix?: boolean;
  versionStatus?: string | null;
  directParent?: string | null;
};

export function componentTier(component: VisibilityComponent): DependencyTier {
  return inferTier(component);
}

export function withInferredTier<T extends VisibilityComponent>(component: T): T & { tier: DependencyTier } {
  return { ...component, tier: inferTier(component) };
}

/** T1 + T2, plus T3 only when security-relevant. */
export function isDefaultInventoryRow(component: VisibilityComponent): boolean {
  const tier = componentTier(component);
  if (tier === "infra" || tier === "direct") return true;
  return (component.cves?.length ?? 0) > 0;
}

export function isSecurityRelevant(component: VisibilityComponent): boolean {
  return (component.cves?.length ?? 0) > 0;
}

export function filterDefaultInventory<T extends VisibilityComponent>(components: T[]): T[] {
  return components.filter((item) => isDefaultInventoryRow(item));
}

export function filterActionableUpdates<T extends VisibilityComponent>(components: T[]): T[] {
  return components.filter((item) => isUpdateAvailable(item.versionStatus) && isDefaultInventoryRow(item));
}

export type TierSummary = {
  infra: number;
  direct: number;
  transitive: number;
  transitiveSecurity: number;
  hiddenTransitive: number;
};

export function summarizeTiers(components: VisibilityComponent[]): TierSummary {
  let infra = 0;
  let direct = 0;
  let transitive = 0;
  let transitiveSecurity = 0;
  for (const item of components) {
    const tier = componentTier(item);
    if (tier === "infra") infra += 1;
    else if (tier === "direct") direct += 1;
    else {
      transitive += 1;
      if (isSecurityRelevant(item)) transitiveSecurity += 1;
    }
  }
  return {
    infra,
    direct,
    transitive,
    transitiveSecurity,
    hiddenTransitive: Math.max(0, transitive - transitiveSecurity),
  };
}

export type TransitiveUpdateGroup<T extends VisibilityComponent> = {
  parent: string;
  count: number;
  securityCount: number;
  items: T[];
};

export function groupHiddenTransitiveUpdates<T extends VisibilityComponent>(
  components: T[],
): TransitiveUpdateGroup<T>[] {
  const hidden = components.filter(
    (item) =>
      isUpdateAvailable(item.versionStatus) &&
      componentTier(item) === "transitive" &&
      !isSecurityRelevant(item),
  );
  const groups = new Map<string, T[]>();
  for (const item of hidden) {
    const parent = item.directParent?.trim() || "other";
    const list = groups.get(parent) ?? [];
    list.push(item);
    groups.set(parent, list);
  }
  return [...groups.entries()]
    .map(([parent, items]) => ({
      parent,
      count: items.length,
      securityCount: 0,
      items: items.slice(0, 8),
    }))
    .sort((left, right) => right.count - left.count || left.parent.localeCompare(right.parent));
}

export function intelBudgetRank(component: VisibilityComponent): number {
  const tier = componentTier(component);
  if (tier === "infra") return 0;
  if (tier === "direct") return 1;
  if (isSecurityRelevant(component)) return 2;
  return 3;
}
