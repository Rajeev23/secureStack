import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { getScan } from "@/services/api/scans";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;

  try {
    const scan = await getScan(session.userId, id);
    return NextResponse.json({ scan });
  } catch (error) {
    return jsonError(error);
  }
}
