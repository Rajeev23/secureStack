import { intelBudgetRank, type VisibilityComponent } from "@/services/intelligence/visibility";

export const MAX_INTEL_PACKAGES = 400;

export type IntelligenceCoverage = {
  uniquePackages: number;
  checkedPackages: number;
  truncated: boolean;
};

export function uniqueByKey<T>(items: T[], keyOf: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

export function selectIntelBudget<T extends VisibilityComponent>(
  unique: T[],
  max = MAX_INTEL_PACKAGES,
): {
  selected: T[];
  coverage: IntelligenceCoverage;
} {
  const limit = Math.max(0, max);
  const ranked = [...unique].sort((left, right) => {
    const rank = intelBudgetRank(left) - intelBudgetRank(right);
    if (rank !== 0) return rank;
    return (left.name ?? "").localeCompare(right.name ?? "");
  });
  const selected = ranked.slice(0, limit);
  return {
    selected,
    coverage: {
      uniquePackages: unique.length,
      checkedPackages: selected.length,
      truncated: unique.length > selected.length,
    },
  };
}

export function mergeCoverage(items: Array<IntelligenceCoverage | null | undefined>): IntelligenceCoverage | null {
  const present = items.filter((item): item is IntelligenceCoverage => Boolean(item));
  if (present.length === 0) return null;
  return {
    uniquePackages: present.reduce((sum, item) => sum + item.uniquePackages, 0),
    checkedPackages: present.reduce((sum, item) => sum + item.checkedPackages, 0),
    truncated: present.some((item) => item.truncated),
  };
}
