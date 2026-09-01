import { NextResponse } from "next/server";
import {
  getRateLimitStore,
  getRequestIp,
  getUpdatedRateLimitRecord,
  isRateLimitBlocked,
} from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;

export async function enforceSessionScanRateLimit(request: Request): Promise<NextResponse | null> {
  const ip = getRequestIp(request);
  const key = `session-scan:${ip}`;
  const now = Date.now();
  const ttlSeconds = Math.ceil(Math.max(WINDOW_MS, BLOCK_MS) / 1000);
  const store = getRateLimitStore();
  const existing = await store.get(key);

  if (isRateLimitBlocked(existing, now)) {
    return NextResponse.json(
      { error: "Too many scans from this address. Try again in a few minutes." },
      { status: 429 },
    );
  }

  await store.set(
    key,
    getUpdatedRateLimitRecord(existing, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
    ttlSeconds,
  );
  return null;
}
