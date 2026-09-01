import { DomainError } from "@/lib/errors";
import { parseGitHubBranch, parseGitHubRepoFullName } from "@/services/github/api";
import { diffSnapshots } from "@/services/intelligence/changes";
import { enrichComponents } from "@/services/intelligence/enrich";
import { parseSbomDocument } from "@/services/intelligence/sbom";
import { mergeComponents, parseManifest } from "@/services/scanner/parse";
import { scanGitHubRepository } from "@/services/scanner/scan-repository";
import type { DetectedComponent } from "@/services/scanner/types";
import {
  MAX_SESSION_GITHUB_REPOS,
  type SessionScanResult,
  type SessionScanSource,
} from "@/services/session-scan/types";

export const MAX_SESSION_UPLOAD_FILES = 40;
export const MAX_SESSION_FILE_CHARS = 500_000;

type RawSnapshot = {
  repositories: Array<{ fullName: string; branch: string; files: string[] }>;
  components: Array<{
    name: string;
    ecosystem: string;
    version: string;
    sourceFile: string;
    repository: string;
    tier?: string;
    upstreamRepo?: string | null;
    directParent?: string | null;
  }>;
};

function mapDetected(
  components: DetectedComponent[],
  repository: string,
): RawSnapshot["components"] {
  return components.map((component) => ({
    name: component.name,
    ecosystem: component.ecosystem,
    version: component.version,
    sourceFile: component.sourceFile,
    repository,
    tier: component.tier,
    upstreamRepo: component.upstreamRepo,
    directParent: component.directParent,
  }));
}

async function finalizeScan(input: {
  source: SessionScanSource;
  label: string;
  snapshot: RawSnapshot;
  githubToken?: string;
}): Promise<SessionScanResult> {
  if (input.snapshot.components.length === 0) {
    throw new DomainError("No packages found to scan.", 400);
  }

  const intel = await enrichComponents(input.snapshot.components, {
    githubToken: input.githubToken,
    environment: "unknown",
    applicationName: input.label,
  });
  const changes = diffSnapshots(null, { components: intel.components });

  return {
    id: crypto.randomUUID(),
    source: input.source,
    label: input.label,
    scannedAt: new Date().toISOString(),
    componentsFound: intel.components.length,
    findingsFound: intel.findings.length,
    snapshot: {
      repositories: input.snapshot.repositories,
      components: intel.components,
      coverage: intel.coverage,
      changes,
    },
    findings: intel.findings,
  };
}

export type SessionGitHubScanRepo = {
  fullName: string;
  branch?: string;
};

export async function runSessionGitHubScan(input: {
  token: string;
  repositories: SessionGitHubScanRepo[];
  paths?: string[];
}): Promise<SessionScanResult> {
  if (input.repositories.length === 0) {
    throw new DomainError("Choose at least one GitHub repository.", 400);
  }
  if (input.repositories.length > MAX_SESSION_GITHUB_REPOS) {
    throw new DomainError(`Scan at most ${MAX_SESSION_GITHUB_REPOS} repositories at a time.`, 400);
  }

  const paths = input.paths && input.paths.length > 0 ? input.paths : undefined;
  if (paths && input.repositories.length > 1) {
    throw new DomainError("Pick one repository to scan specific files.", 400);
  }

  const snapshot: RawSnapshot = { repositories: [], components: [] };

  for (const repo of input.repositories) {
    const fullName = parseGitHubRepoFullName(repo.fullName);
    if (!fullName) {
      throw new DomainError("Choose a GitHub repository (owner/name).", 400);
    }
    const branch =
      typeof repo.branch === "string" && repo.branch.trim()
        ? parseGitHubBranch(repo.branch)
        : "main";
    if (!branch) {
      throw new DomainError("That branch name is not valid.", 400);
    }

    const result = await scanGitHubRepository(input.token, fullName, branch, { paths });
    snapshot.repositories.push({ fullName, branch, files: result.files });
    snapshot.components.push(...mapDetected(result.components, fullName));
  }

  const first = snapshot.repositories[0]?.fullName ?? "GitHub";
  const label =
    snapshot.repositories.length === 1 ? first : `${snapshot.repositories.length} repositories`;

  return finalizeScan({
    source: "github",
    label,
    githubToken: input.token,
    snapshot,
  });
}

export async function runSessionSbomScan(input: {
  document: unknown;
  githubToken?: string;
}): Promise<SessionScanResult> {
  const parsed = parseSbomDocument(input.document);
  if (parsed.components.length === 0) {
    throw new DomainError("No packages found in the SBOM.", 400);
  }
  return finalizeScan({
    source: "sbom",
    label: "Uploaded SBOM",
    githubToken: input.githubToken,
    snapshot: {
      repositories: [{ fullName: "sbom", branch: "sbom", files: ["sbom.json"] }],
      components: mapDetected(parsed.components, "sbom"),
    },
  });
}

export type SessionUploadFile = {
  path: string;
  content: string;
};

export async function runSessionFilesScan(input: {
  files: SessionUploadFile[];
  githubToken?: string;
}): Promise<SessionScanResult> {
  if (input.files.length === 0) {
    throw new DomainError("Upload at least one manifest or lockfile.", 400);
  }
  if (input.files.length > MAX_SESSION_UPLOAD_FILES) {
    throw new DomainError(`Upload at most ${MAX_SESSION_UPLOAD_FILES} files.`, 400);
  }

  const parsed: DetectedComponent[] = [];
  const readFiles: string[] = [];
  for (const file of input.files) {
    const path = file.path.trim().replace(/\\/g, "/").replace(/^\/+/, "");
    if (!path || path.includes("..")) {
      throw new DomainError("Each file needs a safe relative path.", 400);
    }
    if (file.content.length > MAX_SESSION_FILE_CHARS) {
      throw new DomainError(`${path} is too large to scan in the browser upload.`, 400);
    }
    parsed.push(...parseManifest(path, file.content));
    readFiles.push(path);
  }

  return finalizeScan({
    source: "files",
    label: readFiles.length === 1 ? readFiles[0]! : `${readFiles.length} files`,
    githubToken: input.githubToken,
    snapshot: {
      repositories: [{ fullName: "upload", branch: "upload", files: readFiles }],
      components: mapDetected(mergeComponents(parsed), "upload"),
    },
  });
}
