import {
  CveChip,
  EolStatusChip,
  PriorityChip,
  RecommendationKindChip,
  VersionStatusChip,
} from "@/components/shared/issue-chip";

type IntelligenceBadgesProps = {
  cves?: string[];
  versionStatus?: string | null;
  latestVersion?: string | null;
  eolStatus?: string | null;
  recommendationKind?: string | null;
  priority?: string | null;
  priorityWhy?: string | null;
};

export function IntelligenceBadges({
  cves,
  versionStatus,
  latestVersion,
  eolStatus,
  recommendationKind,
  priority,
  priorityWhy,
}: IntelligenceBadgesProps) {
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
