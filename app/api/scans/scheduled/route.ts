import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { requireCompanyContext } from "@/services/api/company";
import { runDueScheduledScans } from "@/services/api/scans";

export const maxDuration = 120;

export async function POST() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const { companyId } = await requireCompanyContext(session.userId);
    const result = await runDueScheduledScans({ companyId });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error, "Unable to run scheduled scans.");
  }
}
