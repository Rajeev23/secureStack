const GITHUB_API = "https://api.github.com";

export type GithubRepo = {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  description: string | null;
};

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
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 200) || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getGitHubAuthenticatedUser(token: string): Promise<{
  id: number;
  login: string;
}> {
  const user = await githubFetch<{ id: number; login: string }>(token, "/user");
  return { id: user.id, login: user.login };
}

export async function listGitHubRepositories(token: string): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];

  for (let page = 1; page <= 3; page += 1) {
    const batch = await githubFetch<
      Array<{
        id: number;
        full_name: string;
        name: string;
        private: boolean;
        default_branch: string;
        html_url: string;
        description: string | null;
      }>
    >(
      token,
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
    );

    repos.push(
      ...batch.map((repo) => ({
        id: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        private: repo.private,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        description: repo.description,
      })),
    );

    if (batch.length < 100) break;
  }

  return repos;
}
