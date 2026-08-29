import { githubRepoFromName, parseGithubRepoUrl } from "@/services/intelligence/github-repo";
import {
  isLockfilePath,
  isVersionCatalogCandidatePath,
  isVersionCatalogPath,
  manifestBasename,
} from "@/services/scanner/manifests";
import { normalizeComponentName, stripVersionPrefix } from "@/services/scanner/normalize";
import { finalizeDetectedTier, isInfraEcosystem } from "@/services/scanner/tiers";
import type { DetectedComponent, DependencyTier, Ecosystem } from "@/services/scanner/types";

function component(
  name: string,
  ecosystem: Ecosystem,
  version: string,
  sourceFile: string,
  extra: {
    declaredDirect?: boolean;
    tier?: DependencyTier;
    upstreamRepo?: string | null;
    directParent?: string | null;
  } = {},
): DetectedComponent | null {
  const cleanName = normalizeComponentName(name, ecosystem);
  const cleanVersion = stripVersionPrefix(version);
  if (!cleanName || !cleanVersion || cleanVersion === "*" || cleanVersion === "latest") {
    return null;
  }
  const fromLockfile = isLockfilePath(sourceFile);
  const declaredDirect =
    extra.declaredDirect ?? (!fromLockfile && !isInfraEcosystem(ecosystem));
  const row: DetectedComponent = {
    name: cleanName,
    ecosystem,
    version: cleanVersion,
    sourceFile,
    fromLockfile,
    declaredDirect,
    tier: extra.tier ?? "direct",
    upstreamRepo: extra.upstreamRepo ?? null,
    directParent: extra.directParent ?? null,
  };
  row.tier = extra.tier ?? finalizeDetectedTier(row);
  return row;
}

function push(
  list: DetectedComponent[],
  name: string,
  ecosystem: Ecosystem,
  version: string,
  sourceFile: string,
) {
  const item = component(name, ecosystem, version, sourceFile);
  if (item) list.push(item);
}

export function parsePackageJson(content: string, sourceFile: string): DetectedComponent[] {
  const json = JSON.parse(content) as Record<string, unknown>;
  const found: DetectedComponent[] = [];
  const buckets = ["dependencies", "devDependencies", "optionalDependencies"] as const;
  for (const bucket of buckets) {
    const deps = json[bucket];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, version] of Object.entries(deps as Record<string, unknown>)) {
      if (typeof version === "string") push(found, name, "npm", version, sourceFile);
    }
  }
  return found;
}

export function parsePackageLock(content: string, sourceFile: string): DetectedComponent[] {
  const json = JSON.parse(content) as {
    packages?: Record<string, { version?: string; name?: string }>;
    dependencies?: Record<string, { version?: string }>;
  };
  const found: DetectedComponent[] = [];

  if (json.packages) {
    for (const [path, meta] of Object.entries(json.packages)) {
      if (!path || path === "") continue;
      if (!meta.version) continue;
      const marker = "node_modules/";
      const index = path.lastIndexOf(marker);
      const name = meta.name ?? (index >= 0 ? path.slice(index + marker.length) : path);
      if (!name || name.includes("node_modules/")) continue;
      const item = component(name, "npm", meta.version, sourceFile, {
        declaredDirect: false,
        directParent: npmParentFromLockPath(path),
      });
      if (item) found.push(item);
    }
    return found;
  }

  if (json.dependencies) {
    for (const [name, meta] of Object.entries(json.dependencies)) {
      if (meta.version) push(found, name, "npm", meta.version, sourceFile);
    }
  }
  return found;
}

export function parseYarnLock(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const lines = content.split(/\r?\n/);
  let currentNames: string[] = [];

  for (const line of lines) {
    if (!line.startsWith(" ") && line.includes("@") && line.trim().endsWith(":")) {
      currentNames = line
        .replace(/:$/, "")
        .split(",")
        .map((part) => part.trim().replaceAll('"', ""))
        .map((spec) => spec.replace(/@[^@]+$/, ""))
        .filter(Boolean);
      continue;
    }
    const versionMatch = /^\s+version\s+"([^"]+)"/.exec(line);
    if (versionMatch && currentNames.length) {
      for (const name of currentNames) {
        push(found, name, "npm", versionMatch[1], sourceFile);
      }
      currentNames = [];
    }
  }
  return found;
}

export function parsePnpmLock(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  let inPackages = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^packages:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^\S/.test(line) && !line.startsWith("packages")) {
      inPackages = false;
    }
    if (!inPackages) continue;
    const match = /^\s{2}'?(@?[^@'\s]+)@([^':\s]+)'?:/.exec(line);
    if (match) {
      push(found, match[1], "npm", match[2].replace(/\(.*\)$/, ""), sourceFile);
    }
  }
  return found;
}

export function parseRequirementsTxt(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("-")) continue;
    const match = /^([A-Za-z0-9_.-]+)\s*(?:\[.*\])?\s*(?:==|>=|<=|~=|!=|>|<)?\s*([^;#\s]+)?/.exec(line);
    if (!match) continue;
    push(found, match[1], "pypi", match[2] ?? "unspecified", sourceFile);
  }
  return found.filter((item) => item.version !== "unspecified");
}

export function parsePipfile(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  let section: "packages" | "dev" | null = null;
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "[packages]") {
      section = "packages";
      continue;
    }
    if (line === "[dev-packages]") {
      section = "dev";
      continue;
    }
    if (line.startsWith("[") && line.endsWith("]")) {
      section = null;
      continue;
    }
    if (!section || !line || line.startsWith("#")) continue;
    const match = /^"?([^"=]+)"?\s*=\s*"?(==)?([^"]+)"?/.exec(line);
    if (match) push(found, match[1].trim(), "pypi", match[3].replaceAll('"', "").trim(), sourceFile);
  }
  return found;
}

export function parsePyproject(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const pep621 = /dependencies\s*=\s*\[([\s\S]*?)\]/.exec(content);
  if (pep621) {
    const names = pep621[1].match(/"([^"]+)"/g) ?? [];
    for (const quoted of names) {
      const spec = quoted.slice(1, -1);
      const match = /^([A-Za-z0-9_.-]+)\s*(?:\[.*\])?\s*(?:==|>=|<=|~=)?\s*([^;]+)?/.exec(spec);
      if (match?.[2]) push(found, match[1], "pypi", match[2], sourceFile);
    }
  }
  return found;
}

export function parsePoetryLock(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const blocks = content.split(/\[\[package\]\]/);
  for (const block of blocks.slice(1)) {
    const name = /^name\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    const version = /^version\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    if (name && version) push(found, name, "pypi", version, sourceFile);
  }
  return found;
}

export function parseGoMod(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const requireBlock = /require\s*\(([\s\S]*?)\)/g;
  let block: RegExpExecArray | null;
  while ((block = requireBlock.exec(content))) {
    for (const raw of block[1].split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) continue;
      const match = /^(\S+)\s+v?(\S+)/.exec(line);
      if (match) push(found, match[1], "go", match[2], sourceFile);
    }
  }
  const single = /^require\s+(\S+)\s+v?(\S+)/gm;
  let row: RegExpExecArray | null;
  while ((row = single.exec(content))) {
    if (row[1] !== "(") push(found, row[1], "go", row[2], sourceFile);
  }
  return found;
}

export function parseCargoToml(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const section = /\[(?:workspace\.)?dependencies\]([\s\S]*?)(?:\n\[|$)/g;
  let block: RegExpExecArray | null;
  while ((block = section.exec(content))) {
    for (const raw of block[1].split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const simple = /^([A-Za-z0-9_-]+)\s*=\s*"([^"]+)"/.exec(line);
      if (simple) {
        push(found, simple[1], "cargo", simple[2], sourceFile);
        continue;
      }
      const table = /^([A-Za-z0-9_-]+)\s*=\s*\{[^}]*version\s*=\s*"([^"]+)"/.exec(line);
      if (table) push(found, table[1], "cargo", table[2], sourceFile);
    }
  }
  return found;
}

export function parseCargoLock(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const blocks = content.split(/\[\[package\]\]/);
  for (const block of blocks.slice(1)) {
    const name = /^name\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    const version = /^version\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    if (name && version) push(found, name, "cargo", version, sourceFile);
  }
  return found;
}

export function parsePomXml(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const deps = content.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g);
  for (const dep of deps) {
    const groupId = /<groupId>([^<]+)<\/groupId>/.exec(dep[1])?.[1]?.trim();
    const artifactId = /<artifactId>([^<]+)<\/artifactId>/.exec(dep[1])?.[1]?.trim();
    const version = /<version>([^<]+)<\/version>/.exec(dep[1])?.[1]?.trim();
    if (groupId && artifactId && version && !version.startsWith("${")) {
      push(found, `${groupId}:${artifactId}`, "maven", version, sourceFile);
    }
  }
  return found;
}

export function parseGradle(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const matches = content.matchAll(
    /(?:implementation|api|compileOnly|runtimeOnly|testImplementation|compile)\s*[\('"]([^\s'"]+:[^\s'"]+:[^\s'"]+)['"\)]/g,
  );
  for (const match of matches) {
    const [group, artifact, version] = match[1].split(":");
    if (group && artifact && version) {
      push(found, `${group}:${artifact}`, "gradle", version, sourceFile);
    }
  }
  return found;
}

export function parseDockerfile(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const match = /^\s*FROM\s+(?:--platform=\S+\s+)?([^\s]+)(?:\s+AS\s+\S+)?/i.exec(raw);
    if (!match) continue;
    const image = match[1];
    if (image === "scratch") continue;
    const [name, version = "latest"] = image.includes(":")
      ? [image.slice(0, image.lastIndexOf(":")), image.slice(image.lastIndexOf(":") + 1)]
      : [image, "latest"];
    if (version !== "latest") {
      const item = component(name, "docker", version, sourceFile, {
        declaredDirect: false,
        tier: "infra",
      });
      if (item) found.push(item);
    }
  }
  return found;
}

function npmParentFromLockPath(path: string): string | null {
  const normalized = path.replace(/^\/+/, "");
  const idx = normalized.lastIndexOf("/node_modules/");
  if (idx <= 0) return null;
  const parentPath = normalized.slice(0, idx).replace(/^node_modules\//, "");
  return parentPath || null;
}

const VERSION_VALUE = /^(?:v)?\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.]+)?$/;
const CATALOG_GROUP_KEYS = new Set(["components", "tools", "versions", "binaries", "images", "sha256"]);
const CATALOG_SKIP_PINS = new Set(["platform", "sha256", "binaries", "images", "name", "namespace"]);
const CATALOG_FIELD_KEYS = new Set([
  "version",
  "docs",
  "url",
  "name",
  "namespace",
  "chart_repo",
  "chart_name",
  "images",
  "manifest_url",
  "cr_url",
  "release_channel",
  "binaries",
  "sha256",
  "runtime_class",
  "install_dir",
  "compress_images",
  "staging_only",
]);
const CATALOG_KEY =
  /^(\s*)([A-Za-z][\w.-]*):\s*(?:"([^"]*)"|'([^']*)'|([^#\s][^#]*?))?\s*(?:#.*)?$/;
const CATALOG_IMAGE_LINE = /^\s*-\s+["']?([^\s"'#]+)["']?\s*(?:#.*)?$/;

function looksLikePinnedVersion(value: string): boolean {
  return VERSION_VALUE.test(value.trim());
}

function catalogUpstreamRepo(name: string, docs: string | null, url: string | null): string | null {
  return (
    parseGithubRepoUrl(docs ?? "") ??
    parseGithubRepoUrl(url ?? "") ??
    githubRepoFromName(name, "github")
  );
}

function imageTagVersion(image: string): string | null {
  if (!image || image.startsWith("http") || !image.includes(":")) return null;
  const tag = image.slice(image.lastIndexOf(":") + 1);
  const cleaned = stripVersionPrefix(tag);
  return looksLikePinnedVersion(cleaned) ? cleaned : null;
}

function pushCatalogPin(
  found: DetectedComponent[],
  seen: Set<string>,
  name: string,
  version: string,
  sourceFile: string,
  docs: string | null,
  url: string | null,
): void {
  if (CATALOG_SKIP_PINS.has(name.toLowerCase()) || !looksLikePinnedVersion(version)) return;
  const item = component(name, "github", version, sourceFile, {
    declaredDirect: false,
    tier: "infra",
    upstreamRepo: catalogUpstreamRepo(name, docs, url),
  });
  if (!item) return;
  const key = `${item.ecosystem}:${item.name}`;
  if (seen.has(key)) return;
  seen.add(key);
  found.push(item);
}

/** Pins like `runc: { version: "1.4.2" }` in bom.yaml / versions.yaml / tools.yaml. */
export function parseVersionCatalog(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const seen = new Set<string>();
  let nestedMap = false;
  let pinName: string | null = null;
  let pinVersion: string | null = null;
  let pinDocs: string | null = null;
  let pinUrl: string | null = null;
  let imageVersion: string | null = null;

  const flush = () => {
    const version = pinVersion && looksLikePinnedVersion(pinVersion) ? pinVersion : imageVersion;
    if (pinName && version) {
      pushCatalogPin(found, seen, pinName, version, sourceFile, pinDocs, pinUrl);
    }
    pinName = null;
    pinVersion = null;
    pinDocs = null;
    pinUrl = null;
    imageVersion = null;
  };

  for (const raw of content.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;

    const image = CATALOG_IMAGE_LINE.exec(raw);
    if (image && pinName && !imageVersion) {
      imageVersion = imageTagVersion(image[1]);
    }

    const row = CATALOG_KEY.exec(raw);
    if (!row) continue;
    const indent = row[1].length;
    const key = row[2];
    const inline = (row[3] ?? row[4] ?? row[5] ?? "").trim();

    if (indent === 0) {
      if (CATALOG_GROUP_KEYS.has(key)) {
        flush();
        nestedMap = key === "components" || key === "tools" || key === "versions";
        continue;
      }
      nestedMap = false;
      if (key === "version" || CATALOG_SKIP_PINS.has(key)) {
        flush();
        continue;
      }
      flush();
      pinName = key;
      if (inline && looksLikePinnedVersion(inline) && inline !== key) pinVersion = inline;
      continue;
    }

    if (nestedMap && indent === 2 && !CATALOG_FIELD_KEYS.has(key)) {
      flush();
      pinName = key;
      if (inline && looksLikePinnedVersion(inline) && inline !== key) pinVersion = inline;
      continue;
    }

    if (!pinName) continue;
    if (key === "version" && inline) pinVersion = inline;
    if (key === "docs" && inline) pinDocs = inline;
    if (key === "url" && inline) pinUrl = inline;
    if ((key === "manifest_url" || key === "cr_url") && inline && !pinUrl) pinUrl = inline;
  }
  flush();
  return found;
}

export function looksLikeVersionCatalog(content: string): boolean {
  if (/^apiVersion:\s*/m.test(content) && /^kind:\s*/m.test(content)) return false;
  if (/^appVersion:\s*/m.test(content) && /^name:\s*/m.test(content)) return false;
  return parseVersionCatalog(content, "versions.yaml").length >= 1;
}

export function parseCompose(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const match = /^\s*image:\s*["']?([^\s"']+)/.exec(raw);
    if (!match) continue;
    const image = match[1];
    const [name, version = "latest"] = image.includes(":")
      ? [image.slice(0, image.lastIndexOf(":")), image.slice(image.lastIndexOf(":") + 1)]
      : [image, "latest"];
    if (version !== "latest") {
      const item = component(name, "docker", version, sourceFile, {
        declaredDirect: false,
        tier: "infra",
      });
      if (item) found.push(item);
    }
  }
  return found;
}

export function parseGemfile(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const match = /^\s*gem\s+["']([^"']+)["']\s*,\s*["']([^"']+)["']/.exec(raw);
    if (!match) continue;
    const item = component(match[1], "rubygems", match[2], sourceFile, { declaredDirect: true });
    if (item) found.push(item);
  }
  return found;
}

export function parseGemfileLock(content: string, sourceFile: string): DetectedComponent[] {
  const found: DetectedComponent[] = [];
  const direct = new Set<string>();
  let section: "specs" | "deps" | null = null;
  for (const raw of content.split(/\r?\n/)) {
    if (raw.startsWith("  specs:")) {
      section = "specs";
      continue;
    }
    if (raw.startsWith("DEPENDENCIES")) {
      section = "deps";
      continue;
    }
    if (raw && !raw.startsWith(" ") && raw === raw.toUpperCase()) {
      section = null;
      continue;
    }
    if (section === "specs") {
      const match = /^    ([a-zA-Z0-9._-]+) \(([^)]+)\)/.exec(raw);
      if (!match) continue;
      const item = component(match[1], "rubygems", match[2], sourceFile, {
        declaredDirect: false,
      });
      if (item) found.push(item);
      continue;
    }
    if (section === "deps") {
      const match = /^  ([a-zA-Z0-9._-]+)/.exec(raw);
      if (match) direct.add(match[1].toLowerCase());
    }
  }
  return found.map((item) => {
    const declaredDirect = direct.has(item.name.toLowerCase());
    const row = { ...item, declaredDirect };
    return { ...row, tier: finalizeDetectedTier(row) };
  });
}

export function parseComposerJson(content: string, sourceFile: string): DetectedComponent[] {
  const json = JSON.parse(content) as Record<string, unknown>;
  const found: DetectedComponent[] = [];
  for (const bucket of ["require", "require-dev"] as const) {
    const deps = json[bucket];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, version] of Object.entries(deps as Record<string, unknown>)) {
      if (name === "php" || name.startsWith("ext-")) continue;
      if (typeof version === "string") {
        const item = component(name, "composer", version, sourceFile, { declaredDirect: true });
        if (item) found.push(item);
      }
    }
  }
  return found;
}

export function parseComposerLock(content: string, sourceFile: string): DetectedComponent[] {
  const json = JSON.parse(content) as {
    packages?: Array<{ name?: string; version?: string }>;
    "packages-dev"?: Array<{ name?: string; version?: string }>;
  };
  const found: DetectedComponent[] = [];
  for (const pkg of [...(json.packages ?? []), ...(json["packages-dev"] ?? [])]) {
    if (!pkg.name || !pkg.version) continue;
    const item = component(pkg.name, "composer", pkg.version, sourceFile, { declaredDirect: false });
    if (item) found.push(item);
  }
  return found;
}

export function parseManifest(path: string, content: string): DetectedComponent[] {
  try {
    const named = parseManifestByBasename(path, content);
    if (named) return named;
    return parseManifestByContent(path, content);
  } catch {
    return [];
  }
}

function parseManifestByBasename(path: string, content: string): DetectedComponent[] | null {
  const base = manifestBasename(path);
  if (base === "package.json") return parsePackageJson(content, path);
  if (base === "package-lock.json") return parsePackageLock(content, path);
  if (base === "yarn.lock") return parseYarnLock(content, path);
  if (base === "pnpm-lock.yaml") return parsePnpmLock(content, path);
  if (base === "requirements.txt") return parseRequirementsTxt(content, path);
  if (base === "Pipfile") return parsePipfile(content, path);
  if (base === "pyproject.toml") return parsePyproject(content, path);
  if (base === "poetry.lock") return parsePoetryLock(content, path);
  if (base === "go.mod") return parseGoMod(content, path);
  if (base === "Cargo.toml") return parseCargoToml(content, path);
  if (base === "Cargo.lock") return parseCargoLock(content, path);
  if (base === "Gemfile") return parseGemfile(content, path);
  if (base === "Gemfile.lock") return parseGemfileLock(content, path);
  if (base === "composer.json") return parseComposerJson(content, path);
  if (base === "composer.lock") return parseComposerLock(content, path);
  if (base === "pom.xml") return parsePomXml(content, path);
  if (base === "build.gradle" || base === "build.gradle.kts") return parseGradle(content, path);
  if (base === "Dockerfile" || base.startsWith("Dockerfile.")) return parseDockerfile(content, path);
  if (base === "docker-compose.yml" || base === "docker-compose.yaml") {
    return parseCompose(content, path);
  }
  if (isVersionCatalogPath(path)) return parseVersionCatalog(content, path);
  if (isVersionCatalogCandidatePath(path)) {
    return looksLikeVersionCatalog(content) ? parseVersionCatalog(content, path) : [];
  }
  return null;
}

/** Custom filenames (company-specific bom.yaml, renamed package.json, …). */
function parseManifestByContent(path: string, content: string): DetectedComponent[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJsonByShape(path, content);
  }

  if (/^module\s+\S+/m.test(trimmed)) {
    return parseGoMod(content, path);
  }
  if (/^\s*FROM\s+/im.test(trimmed) && !looksLikeVersionCatalog(content)) {
    const docker = parseDockerfile(content, path);
    if (docker.length) return docker;
  }
  if (/^\s*gem\s+["']/m.test(trimmed)) {
    return parseGemfile(content, path);
  }
  if (/^GEM\s*$/m.test(trimmed) && /specs:/.test(trimmed)) {
    return parseGemfileLock(content, path);
  }
  if (/\[dependencies\]/.test(trimmed) || /\[\[package\]\]/.test(trimmed)) {
    if (/\[\[package\]\]/.test(trimmed)) return parseCargoLock(content, path);
    return parseCargoToml(content, path);
  }
  if (/\[project\]/.test(trimmed) || /\[tool\.poetry\]/.test(trimmed)) {
    return parsePyproject(content, path);
  }
  if (/lockfileVersion\s*:/.test(trimmed)) {
    return parsePnpmLock(content, path);
  }
  if (/^\s*image\s*:/m.test(trimmed) && /services\s*:/.test(trimmed)) {
    return parseCompose(content, path);
  }
  if (looksLikeVersionCatalog(content)) {
    return parseVersionCatalog(content, path);
  }
  if (/^[A-Za-z0-9_.-]+\s*==\s*\S+/m.test(trimmed)) {
    return parseRequirementsTxt(content, path);
  }
  if (/<project[\s>]/.test(trimmed) && /<dependency>/.test(trimmed)) {
    return parsePomXml(content, path);
  }
  if (/(?:implementation|api|compileOnly)\s*[\('"]/.test(trimmed)) {
    return parseGradle(content, path);
  }
  return [];
}

function parseJsonByShape(path: string, content: string): DetectedComponent[] {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return [];
  }
  if (!json || typeof json !== "object") return [];
  const record = json as Record<string, unknown>;
  if (record.dependencies || record.devDependencies || record.optionalDependencies) {
    return parsePackageJson(content, path);
  }
  if (record.packages && typeof record.packages === "object" && !Array.isArray(record.packages)) {
    return parsePackageLock(content, path);
  }
  if (Array.isArray(record.packages) || Array.isArray(record["packages-dev"])) {
    return parseComposerLock(content, path);
  }
  if (record.require || record["require-dev"]) {
    return parseComposerJson(content, path);
  }
  return [];
}

export function mergeComponents(items: DetectedComponent[]): DetectedComponent[] {
  const map = new Map<string, DetectedComponent>();
  const sorted = [...items].sort((a, b) => Number(b.fromLockfile) - Number(a.fromLockfile));
  for (const item of sorted) {
    const key = `${item.ecosystem}:${item.name}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item });
      continue;
    }
    const declaredDirect = Boolean(existing.declaredDirect || item.declaredDirect);
    const upstreamRepo = existing.upstreamRepo || item.upstreamRepo;
    const directParent = existing.directParent || item.directParent;
    if (!existing.fromLockfile && item.fromLockfile) {
      map.set(key, {
        ...item,
        declaredDirect,
        upstreamRepo,
        directParent,
        sourceFile: declaredDirect ? existing.sourceFile : item.sourceFile,
      });
      continue;
    }
    if (existing.fromLockfile && !item.fromLockfile) {
      map.set(key, {
        ...existing,
        declaredDirect,
        upstreamRepo,
        directParent,
        sourceFile: declaredDirect ? item.sourceFile : existing.sourceFile,
      });
      continue;
    }
    map.set(key, { ...existing, declaredDirect, upstreamRepo, directParent });
  }
  return [...map.values()]
    .map((item) => {
      const declaredDirect = Boolean(item.declaredDirect);
      const row: DetectedComponent = { ...item, declaredDirect };
      return { ...row, tier: finalizeDetectedTier(row) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
