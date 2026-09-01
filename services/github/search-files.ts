import { DomainError } from "@/lib/errors";
import { parseGitHubBranch, parseGitHubRepoFullName } from "@/services/github/api";
import { listRepositoryBlobPaths } from "@/services/github/contents";
import { filterRepositoryFilePaths } from "@/services/scanner/search-files";

export async function searchGitHubRepositoryFiles(
  token: string,
  input: { fullName: string; branch: string; query: string },
): Promise<{ files: string[]; truncated: boolean; matched: number }> {
  const fullName = parseGitHubRepoFullName(input.fullName);
  const branch = parseGitHubBranch(input.branch);
  if (!fullName || !branch) {
    throw new DomainError("Invalid repository.", 400);
  }

  try {
    const tree = await listRepositoryBlobPaths(token, fullName, branch);
    const filtered = filterRepositoryFilePaths(tree.paths, input.query);
    return {
      files: filtered.files,
      truncated: tree.truncated || filtered.truncated,
      matched: filtered.matched,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("GitHub API 404") || message.includes("GitHub API 403")) {
      throw new DomainError("Unable to list files in that repository.", 404);
    }
    throw new DomainError("Unable to search repository files.", 502);
  }
}
