import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { DomainError } from "@/lib/errors";
import { searchGitHubRepositoryFiles } from "@/services/github/search-files";
import { resolveGitHubSessionToken } from "@/services/github/session-token";

export async function GET(request: Request) {
  try {
    const github = await resolveGitHubSessionToken();
    if (!github) {
      throw new DomainError("Connect GitHub or set GITHUB_TOKEN before listing files.", 409);
    }

    const url = new URL(request.url);
    const fullName = url.searchParams.get("fullName") ?? "";
    const branch = url.searchParams.get("branch") ?? "main";
    const query = url.searchParams.get("q") ?? "";
    if (query.length > 80) {
      return NextResponse.json({ error: "Search is too long." }, { status: 400 });
    }

    const result = await searchGitHubRepositoryFiles(github.accessToken, {
      fullName,
      branch,
      query,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Unable to search repository files.");
  }
}
