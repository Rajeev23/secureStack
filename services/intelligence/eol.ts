import { fetchJson } from "@/services/intelligence/http";
import type { EolStatus } from "@/services/intelligence/types";

const PRODUCT_BY_NAME: Record<string, string> = {
  node: "nodejs",
  nodejs: "nodejs",
  python: "python",
  postgres: "postgresql",
  postgresql: "postgresql",
  redis: "redis",
  nginx: "nginx",
  golang: "go",
  go: "go",
  debian: "debian",
  ubuntu: "ubuntu",
  alpine: "alpine",
  mysql: "mysql",
  mariadb: "mariadb",
  mongo: "mongodb",
  mongodb: "mongodb",
  php: "php",
  ruby: "ruby",
  openjdk: "openjdk",
  eclipse_temurin: "openjdk",
  temurin: "openjdk",
};

type EolCycle = {
  cycle?: string | number;
  eol?: string | boolean;
  support?: string | boolean;
  latest?: string;
  lts?: boolean | string;
};

const cache = new Map<string, EolCycle[] | null>();

export function eolProductFor(name: string, ecosystem: string): string | null {
  const base = name.split("/")[0]?.split(":")[0]?.toLowerCase() ?? "";
  if (PRODUCT_BY_NAME[base]) return PRODUCT_BY_NAME[base];
  if (ecosystem === "docker" && PRODUCT_BY_NAME[name.toLowerCase()]) {
    return PRODUCT_BY_NAME[name.toLowerCase()];
  }
  return null;
}

export function cycleFromVersion(version: string, product: string): string | null {
  const cleaned = version.replace(/^v/i, "").split("-")[0] ?? version;
  const parts = cleaned.split(".").filter(Boolean);
  if (parts.length === 0) return null;
  if (product === "python" || product === "go") {
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0] ?? null;
  }
  return parts[0] ?? null;
}

export function eolStatusFromCycle(
  cycle: EolCycle | undefined,
  now = new Date(),
): { status: EolStatus; eolDate: string | null } {
  if (!cycle) return { status: "unknown", eolDate: null };
  const eol = cycle.eol;
  if (eol === false) return { status: "supported", eolDate: null };
  if (eol === true) return { status: "eol", eolDate: null };
  if (typeof eol !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(eol)) {
    return { status: "unknown", eolDate: null };
  }
  const eolDate = new Date(`${eol.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(eolDate.getTime())) return { status: "unknown", eolDate: null };
  if (eolDate.getTime() <= now.getTime()) return { status: "eol", eolDate: eol.slice(0, 10) };
  const days = (eolDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 180) return { status: "approaching", eolDate: eol.slice(0, 10) };
  return { status: "supported", eolDate: eol.slice(0, 10) };
}

export async function lookupEol(
  name: string,
  ecosystem: string,
  version: string,
): Promise<{ status: EolStatus; eolDate: string | null; latest: string | null }> {
  const product = eolProductFor(name, ecosystem);
  if (!product) return { status: "unknown", eolDate: null, latest: null };

  const cycles = await loadProduct(product);
  const cycleId = cycleFromVersion(version, product);
  const cycle = cycles?.find((item) => String(item.cycle) === cycleId);
  const { status, eolDate } = eolStatusFromCycle(cycle);
  return { status, eolDate, latest: cycle?.latest ?? null };
}

async function loadProduct(product: string): Promise<EolCycle[] | null> {
  if (cache.has(product)) return cache.get(product) ?? null;
  const json = await fetchJson<EolCycle[]>(`https://endoflife.date/api/${encodeURIComponent(product)}.json`);
  cache.set(product, json);
  return json;
}
