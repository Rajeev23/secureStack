import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { scanListSnapshot } from "@/services/scanner/summary";
import { runSbomScan } from "@/services/api/scans";

type RouteContext = { params: Promise<{ id: string }> };

export const maxDuration = 120;

const bodySchema = z.object({
  document: z.unknown(),
});

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Upload a CycloneDX or SPDX JSON document." }, { status: 400 });
  }

  try {
    const scan = await runSbomScan(session.userId, id, parsed.data.document);
    return NextResponse.json(
      { scan: { ...scan, snapshot: scanListSnapshot(scan.snapshot) } },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, "Unable to import SBOM.");
  }
}
