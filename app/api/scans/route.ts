import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { listCompanyScans } from "@/services/api/scans";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const scans = await listCompanyScans(session.userId);
    return NextResponse.json({ scans });
  } catch (error) {
    return jsonError(error);
  }
}
