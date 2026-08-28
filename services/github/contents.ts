const GITHUB_API = "https://api.github.com";

async function githubFetch<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "SecureStack",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 240) || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export type GithubTreeEntry = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

export async function listRepositoryTree(
  token: string,
  fullName: string,
  branch: string,
): Promise<GithubTreeEntry[]> {
  const ref = await githubFetch<{ object: { sha: string } }>(
    token,
    `/repos/${fullName}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  const tree = await githubFetch<{ tree: GithubTreeEntry[]; truncated?: boolean }>(
    token,
    `/repos/${fullName}/git/trees/${ref.object.sha}?recursive=1`,
  );
  return (tree.tree ?? []).filter((entry) => entry.type === "blob");
}

export async function readRepositoryFile(
  token: string,
  fullName: string,
  path: string,
  branch: string,
): Promise<string> {
  const payload = await githubFetch<{
    encoding?: string;
    content?: string;
    encoding_type?: string;
  }>(token, `/repos/${fullName}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`);

  if (!payload.content) {
    throw new Error(`Empty file: ${path}`);
  }

  if (payload.encoding === "base64") {
    return Buffer.from(payload.content.replaceAll("\n", ""), "base64").toString("utf8");
  }

  return payload.content;
}
