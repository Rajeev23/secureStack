import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { scanListSnapshot } from "@/services/scanner/summary";
import { createScan, listScansForProject, runScan } from "@/services/api/scans";

type RouteContext = { params: Promise<{ id: string }> };

export const maxDuration = 120;

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;

  try {
    const scans = await listScansForProject(session.userId, id);
    return NextResponse.json({ scans: scans.map((scan) => ({ ...scan, snapshot: scanListSnapshot(scan.snapshot) })) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;

  try {
    const created = await createScan(session.userId, id);
    const scan = await runScan(session.userId, created.id);
    return NextResponse.json({ scan: { ...scan, snapshot: scanListSnapshot(scan.snapshot) } }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Unable to start scan.");
  }
}
