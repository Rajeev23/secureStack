import { NextResponse } from "next/server";
import {
  getRateLimitStore,
  getRequestIp,
  getUpdatedRateLimitRecord,
  isRateLimitBlocked,
} from "@/lib/auth/rate-limit";
import { forgotPasswordSchema } from "@/lib/auth/signup-schema";
import { createSupabaseRouteClient } from "@/server/supabase/server";
import { requireAppUrl } from "@/server/supabase/env";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 60 * 60 * 1000;

const SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a password reset link.";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const key = `auth:forgot-password:${ip}`;
  const now = Date.now();
  const ttlSeconds = Math.ceil(Math.max(WINDOW_MS, BLOCK_MS) / 1000);
  const store = getRateLimitStore();

  let rateLimitRecord = null;
  try {
    rateLimitRecord = await store.get(key);
  } catch {
    return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503 });
  }

  if (isRateLimitBlocked(rateLimitRecord, now)) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  await store.set(
    key,
    getUpdatedRateLimitRecord(rateLimitRecord, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
    ttlSeconds,
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  const cookieResponse = NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });

  try {
    const supabase = await createSupabaseRouteClient(cookieResponse);
    const origin = requireAppUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error("Password reset email failed", error);
    }

    return cookieResponse;
  } catch (error) {
    console.error("Password reset request failed", error);
    return NextResponse.json({ error: "Unable to send reset email." }, { status: 500 });
  }
}
