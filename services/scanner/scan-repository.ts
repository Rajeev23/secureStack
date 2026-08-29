import { listRepositoryTree, readRepositoryFile } from "@/services/github/contents";
import { isLockfilePath, isManifestPath, isSkippedPath, isVersionCatalogCandidatePath } from "@/services/scanner/manifests";
import { mergeComponents, parseManifest } from "@/services/scanner/parse";
import type { DetectedComponent } from "@/services/scanner/types";
import { normalizeWatchPaths } from "@/services/scanner/watch-paths";

/** Manifests read per repository. Remaining lockfiles are skipped so the request stays inside maxDuration. */
export const MAX_MANIFEST_FILES = 80;

function manifestPriority(path: string): number {
  if (isVersionCatalogCandidatePath(path)) return 0;
  if (isLockfilePath(path)) return 2;
  return 1;
}

export function selectScanFiles(treePaths: string[], selected?: string[]): string[] {
  const watched = selected ? normalizeWatchPaths(selected) : [];
  if (watched.length > 0) {
    const wanted = new Set(watched);
    return treePaths.filter((path) => wanted.has(path)).slice(0, MAX_MANIFEST_FILES);
  }

  return treePaths
    .filter((path) => !isSkippedPath(path) && isManifestPath(path))
    .sort((left, right) => manifestPriority(left) - manifestPriority(right) || left.localeCompare(right))
    .slice(0, MAX_MANIFEST_FILES);
}

export async function scanGitHubRepository(
  token: string,
  fullName: string,
  branch: string,
  options?: { paths?: string[] },
): Promise<{ files: string[]; components: DetectedComponent[] }> {
  const selected = normalizeWatchPaths(options?.paths);
  const files =
    selected.length > 0
      ? selected.slice(0, MAX_MANIFEST_FILES)
      : selectScanFiles((await listRepositoryTree(token, fullName, branch)).map((entry) => entry.path));

  const parsed: DetectedComponent[] = [];
  const readFiles: string[] = [];
  for (const path of files) {
    try {
      const content = await readRepositoryFile(token, fullName, path, branch);
      parsed.push(...parseManifest(path, content));
      readFiles.push(path);
    } catch {
      // Skip unreadable files and continue the scan.
    }
  }

  return {
    files: readFiles,
    components: mergeComponents(parsed),
  };
}
