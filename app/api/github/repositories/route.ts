import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { listConnectedGitHubRepositories } from "@/services/api/github";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const repositories = await listConnectedGitHubRepositories(session.userId);
    return NextResponse.json({ repositories });
  } catch (error) {
    return jsonError(error, "Unable to list GitHub repositories.");
  }
}
