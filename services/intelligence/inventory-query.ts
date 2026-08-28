import {
  filterDefaultInventory,
  groupHiddenTransitiveUpdates,
  summarizeTiers,
  type TierSummary,
} from "@/services/intelligence/visibility";

export function parseInventoryScope(searchParams: URLSearchParams): {
  includeTransitive: boolean;
  outdatedOnly: boolean;
} {
  return {
    includeTransitive: searchParams.get("transitive") === "1",
    outdatedOnly: searchParams.get("outdated") === "1",
  };
}

export function filterInventoryRows<T extends Parameters<typeof filterDefaultInventory>[0][number]>(
  rows: T[],
  includeTransitive: boolean,
): T[] {
  if (includeTransitive) return rows;
  return filterDefaultInventory(rows);
}

export function inventoryMeta<T extends Parameters<typeof summarizeTiers>[0][number]>(
  allRows: T[],
): {
  tiers: TierSummary;
  transitiveGroups: ReturnType<typeof groupHiddenTransitiveUpdates<T>>;
} {
  return {
    tiers: summarizeTiers(allRows),
    transitiveGroups: groupHiddenTransitiveUpdates(allRows),
  };
}
