import { finalizeDetectedTier } from "@/services/scanner/tiers";
import type { DetectedComponent, Ecosystem } from "@/services/scanner/types";
import { normalizeComponentName, stripVersionPrefix } from "@/services/scanner/normalize";

const PURL_ECOSYSTEM: Record<string, Ecosystem> = {
  npm: "npm",
  pypi: "pypi",
  golang: "go",
  go: "go",
  cargo: "cargo",
  crates: "cargo",
  maven: "maven",
  gradle: "gradle",
  gem: "rubygems",
  rubygems: "rubygems",
  composer: "composer",
};

type SbomParseResult = {
  format: "cyclonedx" | "spdx";
  components: DetectedComponent[];
};

export function parseSbomDocument(document: unknown, sourceFile = "sbom.json"): SbomParseResult {
  if (!document || typeof document !== "object") {
    throw new Error("SBOM must be a JSON object.");
  }
  const record = document as Record<string, unknown>;
  if (record.bomFormat === "CycloneDX" || Array.isArray(record.components)) {
    return { format: "cyclonedx", components: parseCycloneDx(record, sourceFile) };
  }
  if (typeof record.spdxVersion === "string" || Array.isArray(record.packages)) {
    return { format: "spdx", components: parseSpdx(record, sourceFile) };
  }
  throw new Error("Upload a CycloneDX or SPDX JSON SBOM.");
}

function parseCycloneDx(record: Record<string, unknown>, sourceFile: string): DetectedComponent[] {
  const components = Array.isArray(record.components) ? record.components : [];
  const found: DetectedComponent[] = [];
  for (const item of components) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const parsed = typeof row.purl === "string" ? parsePurl(row.purl) : null;
    const name = parsed?.name ?? (typeof row.name === "string" ? row.name : null);
    const version = parsed?.version ?? (typeof row.version === "string" ? row.version : null);
    const ecosystem = parsed?.ecosystem ?? null;
    const component = toDetected(name, ecosystem, version, sourceFile);
    if (component) found.push(component);
  }
  return found;
}

function parseSpdx(record: Record<string, unknown>, sourceFile: string): DetectedComponent[] {
  const packages = Array.isArray(record.packages) ? record.packages : [];
  const found: DetectedComponent[] = [];
  for (const item of packages) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const parsed = parsePurl(spdxPurl(row) ?? "");
    const name = parsed?.name ?? (typeof row.name === "string" ? row.name : null);
    const versionRaw = parsed?.version ?? (typeof row.versionInfo === "string" ? row.versionInfo : null);
    const version = versionRaw && versionRaw !== "NOASSERTION" ? versionRaw : null;
    const component = toDetected(name, parsed?.ecosystem ?? null, version, sourceFile);
    if (component) found.push(component);
  }
  return found;
}

function spdxPurl(row: Record<string, unknown>): string | null {
  const refs = Array.isArray(row.externalRefs) ? row.externalRefs : [];
  for (const ref of refs) {
    if (!ref || typeof ref !== "object") continue;
    const entry = ref as Record<string, unknown>;
    if (entry.referenceType === "purl" && typeof entry.referenceLocator === "string") {
      return entry.referenceLocator;
    }
  }
  return null;
}

export function parsePurl(
  purl: string,
): { ecosystem: Ecosystem; name: string; version: string | null } | null {
  const match = /^pkg:([^/]+)\/(.+)$/i.exec(purl.trim());
  if (!match) return null;
  const type = match[1]?.toLowerCase() ?? "";
  const ecosystem = PURL_ECOSYSTEM[type];
  if (!ecosystem) return null;
  const rest = decodeURIComponent(match[2] ?? "");
  const at = rest.lastIndexOf("@");
  const pathPart = at >= 0 ? rest.slice(0, at) : rest;
  const versionPart = at >= 0 ? rest.slice(at + 1) : null;
  if (!pathPart) return null;
  const name = type === "maven" ? pathPart.replace(/\//g, ":") : pathPart;
  return { ecosystem, name, version: versionPart };
}

function toDetected(
  name: string | null,
  ecosystem: Ecosystem | null,
  version: string | null,
  sourceFile: string,
): DetectedComponent | null {
  if (!name || !ecosystem || !version) return null;
  const cleanName = normalizeComponentName(name, ecosystem);
  const cleanVersion = stripVersionPrefix(version);
  if (!cleanName || !cleanVersion || cleanVersion === "*" || cleanVersion === "latest") return null;
  const row: DetectedComponent = {
    name: cleanName,
    ecosystem,
    version: cleanVersion,
    sourceFile,
    fromLockfile: false,
    declaredDirect: true,
    tier: "direct",
    upstreamRepo: null,
    directParent: null,
  };
  return { ...row, tier: finalizeDetectedTier(row) };
}
