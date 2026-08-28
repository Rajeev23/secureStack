import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { updateFindingStatus } from "@/services/api/findings";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "IGNORED", "ACCEPTED_RISK"]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid finding status." }, { status: 400 });
  }

  try {
    const finding = await updateFindingStatus(session.userId, id, parsed.data.status);
    return NextResponse.json({ finding });
  } catch (error) {
    return jsonError(error, "Unable to update finding.");
  }
}
