import { FindingTypeChip, SeverityChip } from "@/components/shared/issue-chip";
import type { Finding } from "@/features/findings/model";

export function FindingTypeBadge({ type }: { type: Finding["findingType"] }) {
  return <FindingTypeChip type={type} />;
}

export function FindingSeverityBadge({ severity }: { severity: Finding["severity"] }) {
  return <SeverityChip severity={severity} />;
}
