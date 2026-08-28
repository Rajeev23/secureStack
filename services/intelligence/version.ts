export function stripVersionNoise(version: string): string {
  return version.trim().replace(/^[vV]/, "").replace(/^[~^>=<]+/, "").split(/\s+/)[0] ?? version;
}

function numericParts(version: string): number[] | null {
  const cleaned = stripVersionNoise(version).split(/[-+]/)[0] ?? "";
  if (!/^\d+(\.\d+)*$/.test(cleaned)) return null;
  return cleaned.split(".").map((part) => Number.parseInt(part, 10));
}

/** Returns -1 if a < b, 0 if equal, 1 if a > b, or null when versions cannot be compared. */
export function compareVersions(a: string, b: string): number | null {
  const left = numericParts(a);
  const right = numericParts(b);
  if (!left || !right) return null;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    if (l < r) return -1;
    if (l > r) return 1;
  }
  return 0;
}

export function isOutdated(current: string, latest: string | null | undefined): boolean {
  if (!latest) return false;
  return compareVersions(current, latest) === -1;
}

export function isUpdateAvailable(status: string | null | undefined): boolean {
  return status === "patch" || status === "minor" || status === "major";
}

export function versionStatus(
  current: string,
  latest: string | null | undefined,
): "up_to_date" | "patch" | "minor" | "major" | "unknown" {
  if (!latest) return "unknown";
  const left = numericParts(current);
  const right = numericParts(latest);
  if (!left || !right) return "unknown";
  const compared = compareVersions(current, latest);
  if (compared === 0 || compared === 1) return "up_to_date";
  if ((left[0] ?? 0) < (right[0] ?? 0)) return "major";
  if ((left[1] ?? 0) < (right[1] ?? 0)) return "minor";
  return "patch";
}

export function pickNewerVersion(candidates: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!best) {
      best = candidate;
      continue;
    }
    if (compareVersions(best, candidate) === -1) best = candidate;
  }
  return best;
}
