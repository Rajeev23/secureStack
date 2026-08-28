import { githubRepoFromName } from "@/services/intelligence/github-repo";
import { fetchJson, mapPool } from "@/services/intelligence/http";
import { lookupLatestGithubTag } from "@/services/intelligence/releases";
import type { RegistryLookup } from "@/services/intelligence/types";

const CONCURRENCY = 6;

type NpmRegistry = { "dist-tags"?: { latest?: string } };
type PypiRegistry = { info?: { version?: string } };
type CratesRegistry = { crate?: { max_stable_version?: string; max_version?: string } };
type GoProxy = { Version?: string };
type MavenSearch = { response?: { docs?: Array<{ latestVersion?: string; v?: string }> } };
type RubyGems = { version?: string };
type Packagist = { packages?: Record<string, Array<{ version?: string }>> };

export async function lookupLatestVersions(
  components: RegistryLookup[],
  options: { githubToken?: string } = {},
): Promise<Map<string, string>> {
  const unique = new Map<string, RegistryLookup>();
  for (const component of components) {
    unique.set(`${component.ecosystem}:${component.name}`, component);
  }

  const entries = [...unique.values()];
  const versions = new Map<string, string>();

  const results = await mapPool(entries, CONCURRENCY, async (component) => {
    const latest = await lookupLatestVersion(component, options.githubToken);
    return { key: `${component.ecosystem}:${component.name}`, latest };
  });

  for (const result of results) {
    if (result.latest) versions.set(result.key, result.latest);
  }
  return versions;
}

async function lookupLatestVersion(component: RegistryLookup, githubToken?: string): Promise<string | null> {
  const { ecosystem, name } = component;
  if (ecosystem === "npm") return lookupNpm(name);
  if (ecosystem === "pypi") return lookupPypi(name);
  if (ecosystem === "cargo") return lookupCrates(name);
  if (ecosystem === "go") return lookupGo(name);
  if (ecosystem === "maven" || ecosystem === "gradle") return lookupMaven(name);
  if (ecosystem === "rubygems") return lookupRubyGems(name);
  if (ecosystem === "composer") return lookupPackagist(name);
  if (ecosystem === "github") {
    const repo =
      (component.upstreamRepo && component.upstreamRepo.includes("/")
        ? githubRepoFromName(component.upstreamRepo, "github") ?? component.upstreamRepo.trim()
        : null) ?? githubRepoFromName(name, "github");
    if (!repo) return null;
    return lookupLatestGithubTag(repo, githubToken);
  }
  return null;
}

async function lookupNpm(name: string): Promise<string | null> {
  const encoded = name.replace("/", "%2f");
  const json = await fetchJson<NpmRegistry>(`https://registry.npmjs.org/${encoded}`);
  return json?.["dist-tags"]?.latest ?? null;
}

async function lookupPypi(name: string): Promise<string | null> {
  const json = await fetchJson<PypiRegistry>(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
  return json?.info?.version ?? null;
}

async function lookupCrates(name: string): Promise<string | null> {
  const json = await fetchJson<CratesRegistry>(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`);
  return json?.crate?.max_stable_version ?? json?.crate?.max_version ?? null;
}

async function lookupGo(name: string): Promise<string | null> {
  const encoded = name
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const json = await fetchJson<GoProxy>(`https://proxy.golang.org/${encoded}/@latest`);
  return json?.Version ? json.Version.replace(/^v/, "") : null;
}

async function lookupMaven(name: string): Promise<string | null> {
  const [group, artifact] = name.split(":");
  if (!group || !artifact) return null;
  const query = `g:${group} AND a:${artifact}`;
  const json = await fetchJson<MavenSearch>(
    `https://search.maven.org/solrsearch/select?q=${encodeURIComponent(query)}&rows=1&wt=json`,
  );
  const doc = json?.response?.docs?.[0];
  return doc?.latestVersion ?? doc?.v ?? null;
}

async function lookupRubyGems(name: string): Promise<string | null> {
  const json = await fetchJson<RubyGems>(`https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json`);
  return json?.version ?? null;
}

async function lookupPackagist(name: string): Promise<string | null> {
  const json = await fetchJson<Packagist>(`https://repo.packagist.org/p2/${name}.json`);
  const versions = json?.packages?.[name];
  return versions?.[0]?.version?.replace(/^v/, "") ?? null;
}
