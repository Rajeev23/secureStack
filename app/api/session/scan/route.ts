import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { DomainError } from "@/lib/errors";
import { readJsonBody } from "@/lib/request-body";
import { parseGitHubBranch, parseGitHubRepoFullName } from "@/services/github/api";
import { resolveGitHubSessionToken } from "@/services/github/session-token";
import { enforceSessionScanRateLimit } from "@/services/session-scan/rate-limit";
import {
  runSessionFilesScan,
  runSessionGitHubScan,
  runSessionSbomScan,
  type SessionGitHubScanRepo,
} from "@/services/session-scan/run";

export const maxDuration = 120;

type ScanBody = {
  source?: unknown;
  fullName?: unknown;
  branch?: unknown;
  repositories?: unknown;
  scanMode?: unknown;
  document?: unknown;
  files?: unknown;
};

function parseGithubRepositories(body: ScanBody): SessionGitHubScanRepo[] {
  if (Array.isArray(body.repositories) && body.repositories.length > 0) {
    return body.repositories.map((item) => {
      if (!item || typeof item !== "object") {
        throw new DomainError("Each repository needs owner/name.", 400);
      }
      const row = item as { fullName?: unknown; branch?: unknown };
      if (typeof row.fullName !== "string") {
        throw new DomainError("Each repository needs owner/name.", 400);
      }
      return {
        fullName: row.fullName,
        branch: typeof row.branch === "string" ? row.branch : undefined,
      };
    });
  }

  if (typeof body.fullName === "string") {
    return [
      {
        fullName: body.fullName,
        branch: typeof body.branch === "string" ? body.branch : undefined,
      },
    ];
  }

  throw new DomainError("Choose a GitHub repository (owner/name).", 400);
}

function parseSelectedPaths(body: ScanBody): string[] | undefined {
  if (body.scanMode !== "selected") return undefined;
  if (!Array.isArray(body.files) || body.files.length === 0) {
    throw new DomainError("Select at least one file to scan.", 400);
  }
  const paths = body.files.filter((item): item is string => typeof item === "string");
  if (paths.length === 0) {
    throw new DomainError("Select at least one file to scan.", 400);
  }
  return paths;
}

export async function POST(request: Request) {
  const limited = await enforceSessionScanRateLimit(request);
  if (limited) return limited;

  try {
    const body = await readJsonBody<ScanBody>(request, {});
    const source = body.source;
    const github = await resolveGitHubSessionToken();

    if (source === "github") {
      if (!github) {
        throw new DomainError("Connect GitHub or set GITHUB_TOKEN before scanning a repository.", 409);
      }
      const repositories = parseGithubRepositories(body);
      for (const repo of repositories) {
        if (!parseGitHubRepoFullName(repo.fullName)) {
          throw new DomainError("Choose a GitHub repository (owner/name).", 400);
        }
        if (repo.branch && !parseGitHubBranch(repo.branch)) {
          throw new DomainError("That branch name is not valid.", 400);
        }
      }
      const scan = await runSessionGitHubScan({
        token: github.accessToken,
        repositories,
        paths: parseSelectedPaths(body),
      });
      return NextResponse.json({ scan }, { status: 201 });
    }

    if (source === "sbom") {
      const scan = await runSessionSbomScan({
        document: body.document,
        githubToken: github?.accessToken,
      });
      return NextResponse.json({ scan }, { status: 201 });
    }

    if (source === "files") {
      if (!Array.isArray(body.files)) {
        throw new DomainError("Upload files as { path, content } objects.", 400);
      }
      const files = body.files.map((item) => {
        if (!item || typeof item !== "object") {
          throw new DomainError("Each upload needs a path and content.", 400);
        }
        const row = item as { path?: unknown; content?: unknown };
        if (typeof row.path !== "string" || typeof row.content !== "string") {
          throw new DomainError("Each upload needs a path and content.", 400);
        }
        return { path: row.path, content: row.content };
      });
      const scan = await runSessionFilesScan({
        files,
        githubToken: github?.accessToken,
      });
      return NextResponse.json({ scan }, { status: 201 });
    }

    throw new DomainError("Scan with GitHub, an SBOM, or uploaded manifests.", 400);
  } catch (error) {
    return jsonError(error, "Unable to complete the scan.");
  }
}
