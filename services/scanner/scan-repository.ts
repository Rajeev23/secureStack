import { listRepositoryTree, readRepositoryFile } from "@/services/github/contents";
import { isLockfilePath, isManifestPath, isSkippedPath, isVersionCatalogCandidatePath } from "@/services/scanner/manifests";
import { mergeComponents, parseManifest } from "@/services/scanner/parse";
import type { DetectedComponent } from "@/services/scanner/types";

/** Manifests read per repository. Remaining lockfiles are skipped so the request stays inside maxDuration. */
export const MAX_MANIFEST_FILES = 80;

function manifestPriority(path: string): number {
  if (isVersionCatalogCandidatePath(path)) return 0;
  if (isLockfilePath(path)) return 2;
  return 1;
}

export async function scanGitHubRepository(
  token: string,
  fullName: string,
  branch: string,
): Promise<{ files: string[]; components: DetectedComponent[] }> {
  const tree = await listRepositoryTree(token, fullName, branch);
  const files = tree
    .map((entry) => entry.path)
    .filter((path) => !isSkippedPath(path) && isManifestPath(path))
    .sort((left, right) => manifestPriority(left) - manifestPriority(right) || left.localeCompare(right))
    .slice(0, MAX_MANIFEST_FILES);

  const parsed: DetectedComponent[] = [];
  for (const path of files) {
    try {
      const content = await readRepositoryFile(token, fullName, path, branch);
      parsed.push(...parseManifest(path, content));
    } catch {
      // Skip unreadable files and continue the scan.
    }
  }

  return {
    files,
    components: mergeComponents(parsed),
  };
}
