export const MAX_WATCH_FILES = 80;
export const MAX_WATCH_PATH_LENGTH = 400;

/** Repo-relative path with no traversal. Null if the value is not a safe Git path. */
export function normalizeWatchPath(path: string): string | null {
  const trimmed = path.trim().replaceAll("\\", "/").replace(/^\/+/, "");
  if (!trimmed || trimmed.length > MAX_WATCH_PATH_LENGTH) return null;
  if (trimmed.includes("\0")) return null;
  const parts = trimmed.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) return null;
  return trimmed;
}

export function normalizeWatchPaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of paths) {
    if (typeof item !== "string") continue;
    const path = normalizeWatchPath(item);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
    if (out.length >= MAX_WATCH_FILES) break;
  }
  return out;
}
