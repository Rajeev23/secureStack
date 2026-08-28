/**
 * Single place to change colors and labels for issue type, severity, status,
 * version drift, EOL, and scan state. UI chips read from here — do not scatter
 * hex values in feature components.
 */
export type PaletteEntry = {
  color: string;
  label: string;
};

const UNKNOWN: PaletteEntry = {
  color: "var(--mute)",
  label: "Unknown",
};

export const SEVERITY_PALETTE: Record<string, PaletteEntry> = {
  CRITICAL: { color: "var(--error)", label: "Critical" },
  HIGH: { color: "#ea580c", label: "High" },
  MEDIUM: { color: "var(--warning)", label: "Medium" },
  LOW: { color: "var(--link)", label: "Low" },
  INFO: { color: "var(--mute)", label: "Info" },
};

export const FINDING_TYPE_PALETTE: Record<string, PaletteEntry> = {
  SECURITY: { color: "var(--error)", label: "Security" },
  UPDATE: { color: "var(--link)", label: "Update" },
  EOL: { color: "var(--gradient-preview-start)", label: "EOL" },
};

export const FINDING_STATUS_PALETTE: Record<string, PaletteEntry> = {
  OPEN: { color: "var(--error)", label: "Open" },
  ACKNOWLEDGED: { color: "#ea580c", label: "Acknowledged" },
  IN_PROGRESS: { color: "var(--link)", label: "In progress" },
  RESOLVED: { color: "#16a34a", label: "Resolved" },
  IGNORED: { color: "var(--mute)", label: "Ignored" },
  ACCEPTED_RISK: { color: "var(--gradient-preview-start)", label: "Accepted risk" },
};

export const VERSION_STATUS_PALETTE: Record<string, PaletteEntry> = {
  up_to_date: { color: "#16a34a", label: "Up to date" },
  patch: { color: "var(--link)", label: "Patch update" },
  minor: { color: "var(--warning)", label: "Minor update" },
  major: { color: "#ea580c", label: "Major update" },
  unknown: { color: "var(--mute)", label: "Unknown" },
};

export const RECOMMENDATION_KIND_PALETTE: Record<string, PaletteEntry> = {
  update_urgent: { color: "var(--error)", label: "Update urgently" },
  update: { color: "#16a34a", label: "Update recommended" },
  review: { color: "#ea580c", label: "Review required" },
  wait: { color: "var(--mute)", label: "Not urgent" },
};

export const DEPENDENCY_TIER_PALETTE: Record<string, PaletteEntry> = {
  infra: { color: "var(--link)", label: "Infra" },
  direct: { color: "#16a34a", label: "Direct" },
  transitive: { color: "var(--mute)", label: "Transitive" },
};

export const PRIORITY_PALETTE: Record<string, PaletteEntry> = {
  P1: { color: "var(--error)", label: "P1" },
  P2: { color: "#ea580c", label: "P2" },
  P3: { color: "var(--warning)", label: "P3" },
  P4: { color: "var(--mute)", label: "P4" },
};

export const IMPACT_PALETTE: Record<string, PaletteEntry> = {
  critical: { color: "var(--error)", label: "Critical impact" },
  high: { color: "#ea580c", label: "High impact" },
  medium: { color: "var(--warning)", label: "Medium impact" },
  low: { color: "var(--link)", label: "Low impact" },
  none: { color: "var(--mute)", label: "No impact" },
};

export const ENVIRONMENT_PALETTE: Record<string, PaletteEntry> = {
  production: { color: "var(--error)", label: "Production" },
  staging: { color: "var(--warning)", label: "Staging" },
  development: { color: "var(--link)", label: "Development" },
  unknown: { color: "var(--mute)", label: "Environment unset" },
};

export const EOL_STATUS_PALETTE: Record<string, PaletteEntry> = {
  eol: { color: "var(--error)", label: "EOL" },
  approaching: { color: "var(--warning)", label: "Approaching EOL" },
  supported: { color: "#16a34a", label: "Supported" },
  unknown: { color: "var(--mute)", label: "Unknown" },
};

export const SCAN_STATUS_PALETTE: Record<string, PaletteEntry> = {
  completed: { color: "#16a34a", label: "Completed" },
  failed: { color: "var(--error)", label: "Failed" },
  running: { color: "var(--warning)", label: "Scanning" },
  pending: { color: "var(--warning)", label: "Scanning" },
};

export const CHANGE_KIND_PALETTE: Record<string, PaletteEntry> = {
  security: { color: "var(--error)", label: "Security" },
  update: { color: "var(--link)", label: "Update" },
  eol: { color: "var(--gradient-preview-start)", label: "EOL" },
  breaking: { color: "#ea580c", label: "Breaking" },
  resolved: { color: "#16a34a", label: "Resolved" },
};

export const CVE_PALETTE: PaletteEntry = {
  color: "var(--error)",
  label: "CVE",
};

export function lookupPalette(
  map: Record<string, PaletteEntry>,
  key: string | null | undefined,
): PaletteEntry {
  if (!key) return UNKNOWN;
  const hit = map[key] ?? map[key.toUpperCase()] ?? map[key.toLowerCase()];
  if (hit) return hit;
  return { color: UNKNOWN.color, label: key.replaceAll("_", " ") };
}
