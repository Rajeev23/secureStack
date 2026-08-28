import { Button } from "@/components/ui/button";

type TierCounts = {
  hiddenTransitive: number;
  transitiveSecurity: number;
  transitive: number;
  direct?: number;
};

export function TransitiveNote({
  tiers,
  includeTransitive,
  onToggle,
}: {
  tiers?: TierCounts | null;
  includeTransitive: boolean;
  onToggle: (next: boolean) => void;
}) {
  if (!tiers || (tiers.hiddenTransitive === 0 && tiers.transitive === 0)) return null;

  if (includeTransitive) {
    return (
      <p className="text-sm text-muted-foreground">
        Showing transitive dependencies.{" "}
        <button type="button" className="text-primary hover:underline" onClick={() => onToggle(false)}>
          Hide routine transitives
        </button>
      </p>
    );
  }

  if (tiers.hiddenTransitive === 0) return null;

  const staleLockfileDump = tiers.direct === 0 && tiers.hiddenTransitive >= 50;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        + {tiers.hiddenTransitive.toLocaleString()} lockfile packages hidden
        {tiers.transitiveSecurity
          ? ` (${tiers.transitiveSecurity.toLocaleString()} with security advisories — already shown)`
          : ""}
        . Inventory shows infrastructure pins and declared dependencies, not node_modules helpers.
        {staleLockfileDump
          ? " This scan stored lockfile rows only — Start Scan again to separate package.json dependencies and version catalogs (bom.yaml)."
          : ""}
      </p>
      <Button variant="outline" size="sm" onClick={() => onToggle(true)}>
        Show
      </Button>
    </div>
  );
}
