import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { isValidCronRequest } from "@/lib/auth/cron";
import { runDueScheduledScans } from "@/services/api/scans";

export const maxDuration = 120;

async function handleCron(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runDueScheduledScans();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error, "Unable to run scheduled scans.");
  }
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
