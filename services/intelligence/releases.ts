import {
  classifyReleaseNotes,
  emptyChangeSummary,
  mergeChangeSummaries,
  changeSummaryHasNotes,
  type ChangeSummary,
} from "@/services/intelligence/changelog";
import { githubRepoForComponent } from "@/services/intelligence/github-repo";
import { fetchJson, mapPool } from "@/services/intelligence/http";
import { intelBudgetRank } from "@/services/intelligence/visibility";
import { compareVersions, isUpdateAvailable, stripVersionNoise } from "@/services/intelligence/version";

export const MAX_RELEASE_LOOKUPS = 40;

export type ReleaseIntel = {
  releasedAt: string | null;
  releaseUrl: string | null;
  changeSummary: ChangeSummary;
};

type GithubRelease = {
  tag_name?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  body?: string | null;
};

type ReleaseLookup = {
  name: string;
  ecosystem: string;
  version: string;
  latestVersion: string | null;
  versionStatus?: string;
  upstreamRepo?: string | null;
  tier?: string;
};

function githubHeaders(token?: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "SecureStack/0.1 (patch update intelligence)",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function releaseVersion(tag: string | undefined): string | null {
  if (!tag) return null;
  const cleaned = stripVersionNoise(tag);
  return cleaned || null;
}

export async function lookupLatestGithubTag(
  repo: string,
  token?: string,
): Promise<string | null> {
  const json = await fetchJson<GithubRelease>(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: githubHeaders(token),
  });
  return releaseVersion(json?.tag_name);
}

async function listGithubReleases(repo: string, token?: string): Promise<GithubRelease[]> {
  const json = await fetchJson<GithubRelease[]>(
    `https://api.github.com/repos/${repo}/releases?per_page=20`,
    { headers: githubHeaders(token) },
  );
  return Array.isArray(json) ? json.filter((item) => !item.draft) : [];
}

function inRange(tagVersion: string, current: string, latest: string): boolean {
  const afterCurrent = compareVersions(current, tagVersion);
  const vsLatest = compareVersions(tagVersion, latest);
  if (afterCurrent === null || vsLatest === null) {
    return stripVersionNoise(tagVersion) === stripVersionNoise(latest);
  }
  return afterCurrent === -1 && vsLatest !== 1;
}

export async function lookupReleaseIntel(
  components: ReleaseLookup[],
  options: { githubToken?: string } = {},
): Promise<Map<string, ReleaseIntel>> {
  const outdated = components.filter(
    (item) => item.latestVersion && isUpdateAvailable(item.versionStatus),
  );
  const selected = [...outdated]
    .sort((left, right) => intelBudgetRank(left) - intelBudgetRank(right))
    .slice(0, MAX_RELEASE_LOOKUPS);
  const results = new Map<string, ReleaseIntel>();

  const fetched = await mapPool(selected, 4, async (component) => {
    const repo = await githubRepoForComponent(
      component.name,
      component.ecosystem,
      component.upstreamRepo,
    );
    if (!repo || !component.latestVersion) {
      return { key: `${component.ecosystem}:${component.name}`, intel: null };
    }

    const releases = await listGithubReleases(repo, options.githubToken);
    const matching = releases.filter((release) => {
      const version = releaseVersion(release.tag_name);
      if (!version) return false;
      return inRange(version, component.version, component.latestVersion ?? version);
    });
    const notes = matching.length
      ? matching
      : releases.filter(
          (release) =>
            stripVersionNoise(release.tag_name ?? "") === stripVersionNoise(component.latestVersion ?? ""),
        );

    const latestMatch =
      notes.find(
        (release) =>
          stripVersionNoise(release.tag_name ?? "") === stripVersionNoise(component.latestVersion ?? ""),
      ) ?? notes[0];

    let changeSummary = notes.length
      ? mergeChangeSummaries(notes.map((release) => classifyReleaseNotes(release.body)))
      : emptyChangeSummary();

    if (!changeSummaryHasNotes(changeSummary)) {
      const changelog = await fetchChangelogNotes(
        repo,
        component.version,
        component.latestVersion,
        options.githubToken,
      );
      if (changelog) changeSummary = changelog;
    }

    return {
      key: `${component.ecosystem}:${component.name}`,
      intel: {
        releasedAt: latestMatch?.published_at ?? null,
        releaseUrl: latestMatch?.html_url ?? `https://github.com/${repo}/releases`,
        changeSummary,
      } satisfies ReleaseIntel,
    };
  });

  for (const row of fetched) {
    if (row.intel) results.set(row.key, row.intel);
  }
  return results;
}

type GithubContent = {
  content?: string;
  encoding?: string;
};

function decodeGithubFile(file: GithubContent | null): string | null {
  if (!file?.content) return null;
  try {
    return Buffer.from(file.content.replaceAll("\n", ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

function changelogSlice(markdown: string, current: string, latest: string | null): string {
  const latestTag = stripVersionNoise(latest ?? "");
  const currentTag = stripVersionNoise(current);
  const heading = /^(#{1,3}|##)\s.*$/m;
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  let end = lines.length;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!heading.test(line) && !/^=+$/.test(line)) continue;
    const version = stripVersionNoise(line.replace(/^#+\s*/, "").replace(/=+$/, ""));
    if (start < 0 && latestTag && version.includes(latestTag)) {
      start = index;
      continue;
    }
    if (start >= 0 && currentTag && version.includes(currentTag)) {
      end = index;
      break;
    }
  }
  const slice = (start >= 0 ? lines.slice(start, end) : lines.slice(0, 120)).join("\n");
  return slice.slice(0, 12_000);
}

async function fetchChangelogNotes(
  repo: string,
  current: string,
  latest: string | null,
  token?: string,
): Promise<ChangeSummary | null> {
  for (const file of ["CHANGELOG.md", "changelog.md", "CHANGES.md", "NEWS.md"]) {
    const json = await fetchJson<GithubContent>(`https://api.github.com/repos/${repo}/contents/${file}`, {
      headers: githubHeaders(token),
    });
    const text = decodeGithubFile(json);
    if (!text?.trim()) continue;
    const summary = classifyReleaseNotes(changelogSlice(text, current, latest));
    if (changeSummaryHasNotes(summary)) return summary;
  }
  return null;
}
