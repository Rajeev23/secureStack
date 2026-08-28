const SKIP_DIR_PARTS = new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  ".next",
  "target",
  "__pycache__",
  ".git",
  ".yarn",
  ".pnpm-store",
  "Pods",
  "coverage",
]);

export const VERSION_CATALOG_FILES = new Set([
  "bom.yaml",
  "bom.yml",
  "versions.yaml",
  "versions.yml",
  "version.yaml",
  "version.yml",
  "tools.yaml",
  "tools.yml",
]);

export const MANIFEST_FILES = new Set([
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "requirements.txt",
  "Pipfile",
  "poetry.lock",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "go.mod",
  "Cargo.toml",
  "Cargo.lock",
  "Gemfile",
  "Gemfile.lock",
  "composer.json",
  "composer.lock",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ...VERSION_CATALOG_FILES,
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "poetry.lock",
  "Cargo.lock",
  "Gemfile.lock",
  "composer.lock",
]);

export function isSkippedPath(path: string): boolean {
  return path.split("/").some((part) => SKIP_DIR_PARTS.has(part));
}

export function isVersionCatalogPath(path: string): boolean {
  return VERSION_CATALOG_FILES.has(manifestBasename(path).toLowerCase());
}

/** YAML files the scanner should try as custom version catalogs (runc-style pins). */
export function isVersionCatalogCandidatePath(path: string): boolean {
  if (isVersionCatalogPath(path)) return true;
  const base = manifestBasename(path);
  if (!/\.ya?ml$/i.test(base)) return false;
  if (path.includes(".github/workflows") || path.includes("docker-compose")) return false;
  if (/^bom\.ya?ml$/i.test(base)) return true;
  return /(?:^|\/)(?:components|versions?|tools)\/[^/]+\.ya?ml$/i.test(path);
}

export function isManifestPath(path: string): boolean {
  const base = path.split("/").pop() ?? "";
  if (base === "Dockerfile" || base.startsWith("Dockerfile.")) return true;
  if (MANIFEST_FILES.has(base)) return true;
  return isVersionCatalogCandidatePath(path);
}

export function isLockfilePath(path: string): boolean {
  const base = path.split("/").pop() ?? "";
  return LOCKFILES.has(base);
}

export function manifestBasename(path: string): string {
  return path.split("/").pop() ?? path;
}
