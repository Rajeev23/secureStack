import { isManifestPath, isSkippedPath, manifestBasename } from "@/services/scanner/manifests";

export const MAX_FILE_SEARCH_RESULTS = 50;

function rankPath(path: string, query: string): number {
  const lower = path.toLowerCase();
  const base = manifestBasename(path).toLowerCase();
  if (!query) {
    if (isManifestPath(path)) return 0;
    return 50;
  }
  if (lower === query) return 0;
  if (base === query) return 1;
  if (base.startsWith(query)) return 2;
  if (base.includes(query)) return 3;
  if (lower.includes(query)) return 4;
  return 100;
}

/** Filter a Git blob path list for the connect-file picker. Empty query prefers known manifests. */
export function filterRepositoryFilePaths(
  paths: string[],
  query: string,
  limit = MAX_FILE_SEARCH_RESULTS,
): { files: string[]; truncated: boolean; matched: number } {
  const needle = query.trim().toLowerCase();
  const candidates = paths.filter((path) => {
    if (isSkippedPath(path)) return false;
    if (!needle) return isManifestPath(path);
    return path.toLowerCase().includes(needle);
  });

  const ranked = [...candidates].sort(
    (left, right) => rankPath(left, needle) - rankPath(right, needle) || left.localeCompare(right),
  );
  return {
    files: ranked.slice(0, limit),
    truncated: ranked.length > limit,
    matched: ranked.length,
  };
}
