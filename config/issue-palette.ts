/**
 * Semantic color tokens — single source of truth.
 *
 * Industry-standard mapping (aligned with CVSS / common security tooling):
 *   critical → deep red      (immediate action)
 *   danger   → red           (errors, open findings, EOL, production)
 *   warning  → orange        (high severity, breaking, acknowledged)
 *   caution  → amber         (medium severity, approaching deadlines, in-flight)
 *   info     → blue          (low severity, updates, informational)
 *   success  → green         (resolved, healthy, up to date)
 *   special  → violet        (accepted risk, EOL categorization)
 *   neutral  → gray          (unknown, ignored, no impact)
 *
 * Change a color here and every palette updates consistently.
 * Values are WCAG AA–friendly on white backgrounds (≥ 4.5:1 as text).
 */
export const TOKENS = {
  critical: "#991b1b", // red-800
  danger: "#dc2626", //   red-600
  warning: "#c2410c", //  orange-700
  caution: "#b45309", //  amber-700
  info: "#1d4ed8", //     blue-700
  success: "#15803d", //  green-700
  special: "#6d28d9", //  violet-700
  neutral: "#6b7280", //  gray-500
} as const;

export type PaletteEntry = {
  color: string;
  label: string;
};

export const UNKNOWN: PaletteEntry = {
  color: TOKENS.neutral,
  label: "Unknown",
};

/** Safe lookup: always returns an entry, falling back to UNKNOWN. */
export function getPaletteEntry(
  palette: Record<string, PaletteEntry>,
  key: string | null | undefined,
): PaletteEntry {
  if (!key) return UNKNOWN;
  return palette[key] ?? UNKNOWN;
}

/**
 * Chip lookup. Same palettes as `getPaletteEntry`, but keys match
 * case-insensitively (P1, critical vs CRITICAL).
 */
export function lookupPalette(
  palette: Record<string, PaletteEntry>,
  key: string | null | undefined,
): PaletteEntry {
  if (!key) return UNKNOWN;
  return palette[key] ?? palette[key.toUpperCase()] ?? palette[key.toLowerCase()] ?? UNKNOWN;
}

export const SEVERITY_PALETTE: Record<string, PaletteEntry> = {
  CRITICAL: { color: TOKENS.critical, label: "Critical" },
  HIGH: { color: TOKENS.danger, label: "High" },
  MEDIUM: { color: TOKENS.caution, label: "Medium" },
  LOW: { color: TOKENS.info, label: "Low" },
  INFO: { color: TOKENS.neutral, label: "Info" },
};

export const FINDING_TYPE_PALETTE: Record<string, PaletteEntry> = {
  SECURITY: { color: TOKENS.danger, label: "Security" },
  UPDATE: { color: TOKENS.info, label: "Update" },
  EOL: { color: TOKENS.special, label: "EOL" },
};

export const FINDING_STATUS_PALETTE: Record<string, PaletteEntry> = {
  OPEN: { color: TOKENS.danger, label: "Open" },
  ACKNOWLEDGED: { color: TOKENS.warning, label: "Acknowledged" },
  IN_PROGRESS: { color: TOKENS.caution, label: "In progress" },
  RESOLVED: { color: TOKENS.success, label: "Resolved" },
  IGNORED: { color: TOKENS.neutral, label: "Ignored" },
  ACCEPTED_RISK: { color: TOKENS.special, label: "Accepted risk" },
};

export const VERSION_STATUS_PALETTE: Record<string, PaletteEntry> = {
  up_to_date: { color: TOKENS.success, label: "Up to date" },
  patch: { color: TOKENS.info, label: "Patch update" },
  minor: { color: TOKENS.caution, label: "Minor update" },
  major: { color: TOKENS.warning, label: "Major update" },
  unknown: { color: TOKENS.neutral, label: "Unknown" },
};

export const RECOMMENDATION_KIND_PALETTE: Record<string, PaletteEntry> = {
  update_urgent: { color: TOKENS.danger, label: "Update urgently" },
  update: { color: TOKENS.info, label: "Update recommended" },
  review: { color: TOKENS.warning, label: "Review required" },
  wait: { color: TOKENS.neutral, label: "Not urgent" },
};

export const DEPENDENCY_TIER_PALETTE: Record<string, PaletteEntry> = {
  infra: { color: TOKENS.special, label: "Infra" },
  direct: { color: TOKENS.info, label: "Direct" },
  transitive: { color: TOKENS.neutral, label: "Transitive" },
};

export const PRIORITY_PALETTE: Record<string, PaletteEntry> = {
  P1: { color: TOKENS.critical, label: "P1" },
  P2: { color: TOKENS.danger, label: "P2" },
  P3: { color: TOKENS.caution, label: "P3" },
  P4: { color: TOKENS.neutral, label: "P4" },
};

export const IMPACT_PALETTE: Record<string, PaletteEntry> = {
  critical: { color: TOKENS.critical, label: "Critical impact" },
  high: { color: TOKENS.danger, label: "High impact" },
  medium: { color: TOKENS.caution, label: "Medium impact" },
  low: { color: TOKENS.info, label: "Low impact" },
  none: { color: TOKENS.neutral, label: "No impact" },
};

export const ENVIRONMENT_PALETTE: Record<string, PaletteEntry> = {
  production: { color: TOKENS.danger, label: "Production" },
  staging: { color: TOKENS.caution, label: "Staging" },
  development: { color: TOKENS.info, label: "Development" },
  unknown: { color: TOKENS.neutral, label: "Environment unset" },
};

export const EOL_STATUS_PALETTE: Record<string, PaletteEntry> = {
  eol: { color: TOKENS.danger, label: "EOL" },
  approaching: { color: TOKENS.caution, label: "Approaching EOL" },
  supported: { color: TOKENS.success, label: "Supported" },
  unknown: { color: TOKENS.neutral, label: "Unknown" },
};

export const SCAN_STATUS_PALETTE: Record<string, PaletteEntry> = {
  completed: { color: TOKENS.success, label: "Completed" },
  failed: { color: TOKENS.danger, label: "Failed" },
  running: { color: TOKENS.caution, label: "Scanning" },
  pending: { color: TOKENS.caution, label: "Scanning" },
};

export const CHANGE_KIND_PALETTE: Record<string, PaletteEntry> = {
  security: { color: TOKENS.danger, label: "Security" },
  update: { color: TOKENS.info, label: "Update" },
  eol: { color: TOKENS.special, label: "EOL" },
  breaking: { color: TOKENS.warning, label: "Breaking" },
  resolved: { color: TOKENS.success, label: "Resolved" },
};

export const CVE_PALETTE: PaletteEntry = {
  color: TOKENS.danger,
  label: "CVE",
};
