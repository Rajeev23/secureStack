import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { listOpenFindingsForCompany } from "@/services/api/findings";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const findings = await listOpenFindingsForCompany(session.userId);
    return NextResponse.json({ findings });
  } catch (error) {
    return jsonError(error);
  }
}
