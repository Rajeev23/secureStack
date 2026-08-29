import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { searchConnectedGitHubFiles } from "@/services/api/github";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const url = new URL(request.url);
  const fullName = url.searchParams.get("fullName") ?? "";
  const branch = url.searchParams.get("branch") ?? "main";
  const query = url.searchParams.get("q") ?? "";
  if (query.length > 80) {
    return NextResponse.json({ error: "Search is too long." }, { status: 400 });
  }

  try {
    const result = await searchConnectedGitHubFiles(session.userId, { fullName, branch, query });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Unable to search repository files.");
  }
}
