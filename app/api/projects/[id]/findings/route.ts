import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { listFindingsForProject } from "@/services/api/findings";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;

  try {
    const findings = await listFindingsForProject(session.userId, id);
    return NextResponse.json({ findings });
  } catch (error) {
    return jsonError(error);
  }
}
