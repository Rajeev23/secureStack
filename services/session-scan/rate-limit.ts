import { NextResponse } from "next/server";
import {
  getRateLimitStore,
  getRequestIp,
  getUpdatedRateLimitRecord,
  isRateLimitBlocked,
} from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

type SessionRateLimitOptions = {
  keyPrefix: string;
  maxAttempts: number;
  message: string;
};

async function enforceSessionIpRateLimit(
  request: Request,
  options: SessionRateLimitOptions,
): Promise<NextResponse | null> {
  const ip = getRequestIp(request);
  const key = `${options.keyPrefix}:${ip}`;
  const now = Date.now();
  const ttlSeconds = Math.ceil(Math.max(WINDOW_MS, BLOCK_MS) / 1000);
  const store = getRateLimitStore();
  const existing = await store.get(key);

  if (isRateLimitBlocked(existing, now)) {
    return NextResponse.json({ error: options.message }, { status: 429 });
  }

  await store.set(
    key,
    getUpdatedRateLimitRecord(existing, now, WINDOW_MS, options.maxAttempts, BLOCK_MS),
    ttlSeconds,
  );
  return null;
}

export async function enforceSessionScanRateLimit(request: Request): Promise<NextResponse | null> {
  return enforceSessionIpRateLimit(request, {
    keyPrefix: "session-scan",
    maxAttempts: 8,
    message: "Too many scans from this address. Try again in a few minutes.",
  });
}

export async function enforceSessionGithubWriteRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  return enforceSessionIpRateLimit(request, {
    keyPrefix: "session-github-write",
    maxAttempts: 12,
    message: "Too many GitHub connect attempts from this address. Try again in a few minutes.",
  });
}

export async function enforceSessionGithubReadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  return enforceSessionIpRateLimit(request, {
    keyPrefix: "session-github-read",
    maxAttempts: 60,
    message: "Too many GitHub requests from this address. Try again in a few minutes.",
  });
}
