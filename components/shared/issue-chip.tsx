import { TableChip } from "@/components/shared/table-chip";
import {
  CHANGE_KIND_PALETTE,
  CVE_PALETTE,
  EOL_STATUS_PALETTE,
  FINDING_TYPE_PALETTE,
  SCAN_STATUS_PALETTE,
  SEVERITY_PALETTE,
  VERSION_STATUS_PALETTE,
  RECOMMENDATION_KIND_PALETTE,
  DEPENDENCY_TIER_PALETTE,
  PRIORITY_PALETTE,
  IMPACT_PALETTE,
  ENVIRONMENT_PALETTE,
  lookupPalette,
} from "@/config/issue-palette";

export function IssueChip({
  color,
  children,
}: {
  color: string;
  children: string;
}) {
  return (
    <TableChip leadingDot filled color={color}>
      {children}
    </TableChip>
  );
}

export function SeverityChip({ severity }: { severity: string }) {
  const item = lookupPalette(SEVERITY_PALETTE, severity);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function FindingTypeChip({ type }: { type: string }) {
  const item = lookupPalette(FINDING_TYPE_PALETTE, type);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function VersionStatusChip({ status }: { status: string }) {
  const item = lookupPalette(VERSION_STATUS_PALETTE, status);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function RecommendationKindChip({ kind }: { kind: string }) {
  const item = lookupPalette(RECOMMENDATION_KIND_PALETTE, kind);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function DependencyTierChip({ tier }: { tier: string }) {
  const item = lookupPalette(DEPENDENCY_TIER_PALETTE, tier);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function EolStatusChip({ status }: { status: string }) {
  const item = lookupPalette(EOL_STATUS_PALETTE, status);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function ScanStatusChip({ status }: { status: string }) {
  const item = lookupPalette(SCAN_STATUS_PALETTE, status);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function ChangeKindChip({ kind }: { kind: string }) {
  const item = lookupPalette(CHANGE_KIND_PALETTE, kind);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function CveChip({ cves }: { cves: string[] }) {
  if (cves.length === 0) return null;
  const label = cves.length === 1 ? (cves[0] ?? "CVE") : `${cves.length} CVEs`;
  return <IssueChip color={CVE_PALETTE.color}>{label}</IssueChip>;
}

export function PriorityChip({ priority }: { priority: string }) {
  const item = lookupPalette(PRIORITY_PALETTE, priority);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function ImpactChip({ impact }: { impact: string }) {
  const item = lookupPalette(IMPACT_PALETTE, impact);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}

export function EnvironmentChip({ environment }: { environment: string }) {
  const item = lookupPalette(ENVIRONMENT_PALETTE, environment);
  return <IssueChip color={item.color}>{item.label}</IssueChip>;
}
