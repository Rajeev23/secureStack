import {
  CveChip,
  EolStatusChip,
  PriorityChip,
  RecommendationKindChip,
  VersionStatusChip,
} from "@/components/shared/issue-chip";

export type InventoryStatusItem =
  | { type: "cve"; cves: string[] }
  | { type: "eol"; status: string }
  | { type: "recommendation"; kind: string }
  | { type: "version"; status: string };

export function inventoryTableStatus(input: {
  cves?: string[];
  versionStatus?: string | null;
  latestVersion?: string | null;
  eolStatus?: string | null;
  recommendationKind?: string | null;
}): InventoryStatusItem[] {
  const items: InventoryStatusItem[] = [];
  if (input.cves?.length) items.push({ type: "cve", cves: input.cves });
  if (input.eolStatus === "eol" || input.eolStatus === "approaching") {
    items.push({ type: "eol", status: input.eolStatus });
  }
  if (input.recommendationKind) {
    items.push({ type: "recommendation", kind: input.recommendationKind });
    return items;
  }
  if (input.versionStatus && input.versionStatus !== "up_to_date" && input.versionStatus !== "unknown") {
    items.push({ type: "version", status: input.versionStatus });
    return items;
  }
  if (input.latestVersion || input.versionStatus === "up_to_date") {
    items.push({ type: "version", status: "up_to_date" });
  }
  return items;
}

type IntelligenceBadgesProps = {
  cves?: string[];
  versionStatus?: string | null;
  latestVersion?: string | null;
  eolStatus?: string | null;
  recommendationKind?: string | null;
  priority?: string | null;
  priorityWhy?: string | null;
  /** Table rows: no P-chip (that is its own column) and no minor/major next to a recommendation. */
  variant?: "table" | "full";
};

export function IntelligenceBadges({
  cves,
  versionStatus,
  latestVersion,
  eolStatus,
  recommendationKind,
  priority,
  priorityWhy,
  variant = "full",
}: IntelligenceBadgesProps) {
  if (variant === "table") {
    const items = inventoryTableStatus({
      cves,
      versionStatus,
      latestVersion,
      eolStatus,
      recommendationKind,
    });
    if (items.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <span className="flex max-w-52 flex-wrap gap-1">
        {items.map((item) => {
          if (item.type === "cve") return <CveChip key="cve" cves={item.cves} />;
          if (item.type === "eol") return <EolStatusChip key="eol" status={item.status} />;
          if (item.type === "recommendation") {
            return <RecommendationKindChip key="rec" kind={item.kind} />;
          }
          return <VersionStatusChip key="version" status={item.status} />;
        })}
      </span>
    );
  }

  const badges = [];
  if (priority) {
    badges.push(
      <span key="priority" title={priorityWhy ?? undefined}>
        <PriorityChip priority={priority} />
      </span>,
    );
  }
  if (cves?.length) {
    badges.push(<CveChip key="cve" cves={cves} />);
  }
  if (eolStatus === "eol" || eolStatus === "approaching") {
    badges.push(<EolStatusChip key="eol" status={eolStatus} />);
  }
  if (recommendationKind) {
    badges.push(<RecommendationKindChip key="rec" kind={recommendationKind} />);
  }
  if (!cves?.length && versionStatus && versionStatus !== "up_to_date" && versionStatus !== "unknown") {
    badges.push(<VersionStatusChip key="update" status={versionStatus} />);
  }
  if (badges.length === 0 && (latestVersion || versionStatus === "up_to_date")) {
    badges.push(<VersionStatusChip key="ok" status="up_to_date" />);
  }
  if (badges.length === 0) return <span className="text-muted-foreground">—</span>;
  return <span className="flex flex-wrap gap-1">{badges}</span>;
}
