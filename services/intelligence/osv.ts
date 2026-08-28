import { fetchJson, mapPool } from "@/services/intelligence/http";
import { githubRepoFromName } from "@/services/intelligence/github-repo";
import { pickNewerVersion } from "@/services/intelligence/version";

const OSV_ECOSYSTEM: Record<string, string> = {
  npm: "npm",
  pypi: "PyPI",
  go: "Go",
  cargo: "crates.io",
  maven: "Maven",
  gradle: "Maven",
  rubygems: "RubyGems",
  composer: "Packagist",
};

export type OsvQuery = {
  name: string;
  ecosystem: string;
  version: string;
  upstreamRepo?: string | null;
};

type OsvBatchResponse = {
  results?: Array<{ vulns?: Array<{ id: string; modified?: string }> }>;
};

type OsvEvent = { introduced?: string; fixed?: string; last_affected?: string; limit?: string };

type OsvAffected = {
  package?: { name?: string; ecosystem?: string };
  ranges?: Array<{ events?: OsvEvent[] }>;
};

export type OsvRecord = {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  severity?: Array<{ type?: string; score?: string }>;
  database_specific?: { severity?: string };
  affected?: OsvAffected[];
};

export function osvEcosystemFor(ecosystem: string): string | null {
  return OSV_ECOSYSTEM[ecosystem] ?? null;
}

export function osvPackageFor(query: OsvQuery): { name: string; ecosystem: string } | null {
  if (query.ecosystem === "github") {
    const repo =
      (query.upstreamRepo?.includes("/") ? query.upstreamRepo.trim() : null) ??
      githubRepoFromName(query.name, "github");
    if (!repo) return null;
    return { name: `github.com/${repo}`, ecosystem: "Go" };
  }
  const ecosystem = osvEcosystemFor(query.ecosystem);
  if (!ecosystem) return null;
  return { name: query.name, ecosystem };
}

export function componentOsvKey(name: string, ecosystem: string, version: string): string {
  return `${ecosystem}:${name}:${version}`;
}

export function cveIdFromRecord(record: OsvRecord): string {
  const alias = (record.aliases ?? []).find((id) => /^CVE-\d{4}-\d+/i.test(id));
  return alias ?? record.id;
}

export function severityFromOsv(record: OsvRecord): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" {
  const labeled = record.database_specific?.severity?.toUpperCase();
  if (labeled === "CRITICAL" || labeled === "HIGH" || labeled === "MEDIUM" || labeled === "LOW") {
    return labeled;
  }

  const scores = (record.severity ?? [])
    .map((entry) => parseCvssScore(entry.score ?? ""))
    .filter((score): score is number => score !== null);
  const max = scores.length ? Math.max(...scores) : null;
  if (max === null) return "MEDIUM";
  if (max >= 9) return "CRITICAL";
  if (max >= 7) return "HIGH";
  if (max >= 4) return "MEDIUM";
  return "LOW";
}

export function parseCvssScore(score: string): number | null {
  const trimmed = score.trim();
  const numeric = trimmed.match(/^(\d+(?:\.\d+)?)(?:\s|$)/);
  if (numeric) return Number.parseFloat(numeric[1] ?? "");
  return null;
}

export function fixedVersionFromRecord(record: OsvRecord, name: string): string | null {
  const fixed: string[] = [];
  const needle = name.toLowerCase();
  for (const affected of record.affected ?? []) {
    const packageName = affected.package?.name?.toLowerCase();
    if (packageName && packageName !== needle && !packageName.endsWith(`/${needle}`)) continue;
    for (const range of affected.ranges ?? []) {
      for (const event of range.events ?? []) {
        if (event.fixed) fixed.push(event.fixed);
      }
    }
  }
  return pickNewerVersion(fixed);
}

export const OSV_QUERY_BATCH_SIZE = 150;

export async function queryOsvForComponents(queries: OsvQuery[]): Promise<Map<string, OsvRecord[]>> {
  const matched = new Map<string, OsvRecord[]>();
  const osvQueries = queries
    .map((query) => ({ query, pkg: osvPackageFor(query) }))
    .filter((item): item is { query: OsvQuery; pkg: { name: string; ecosystem: string } } => Boolean(item.pkg));
  if (osvQueries.length === 0) return matched;

  const batchResults: Array<{ vulns?: Array<{ id: string; modified?: string }> }> = [];
  for (let offset = 0; offset < osvQueries.length; offset += OSV_QUERY_BATCH_SIZE) {
    const slice = osvQueries.slice(offset, offset + OSV_QUERY_BATCH_SIZE);
    const batch = await fetchJson<OsvBatchResponse>("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: slice.map((item) => ({
          version: item.query.version,
          package: item.pkg,
        })),
      }),
      signal: AbortSignal.timeout(20000),
    });
    batchResults.push(...(batch?.results ?? []));
  }

  const ids = new Set<string>();
  for (const result of batchResults) {
    for (const vuln of result.vulns ?? []) {
      if (vuln.id) ids.add(vuln.id);
    }
  }

  const recordsById = new Map<string, OsvRecord>();
  const hydrated = await mapPool([...ids], 5, async (id) => {
    const record = await fetchJson<OsvRecord>(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`);
    return record?.id ? record : null;
  });
  for (const record of hydrated) {
    if (record) recordsById.set(record.id, record);
  }

  osvQueries.forEach((item, index) => {
    const key = componentOsvKey(item.query.name, item.query.ecosystem, item.query.version);
    const idsForQuery = (batchResults[index]?.vulns ?? [])
      .map((vuln) => recordsById.get(vuln.id))
      .filter((record): record is OsvRecord => Boolean(record));
    matched.set(key, idsForQuery);
  });

  return matched;
}
