import { NextResponse } from "next/server";
import {
  getRateLimitStore,
  getRequestIp,
  getUpdatedRateLimitRecord,
  isRateLimitBlocked,
} from "@/lib/auth/rate-limit";
import { signupSchema } from "@/lib/auth/signup-schema";
import { DomainError } from "@/lib/errors";
import { isAuthNetworkError } from "@/lib/auth/fetch-timeout";
import { normalizeName } from "@/lib/company/names";
import { createSupabaseRouteClient } from "@/server/supabase/server";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 60 * 60 * 1000;

function withCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const key = `auth:signup:${ip}`;
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
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    await store.set(
      key,
      getUpdatedRateLimitRecord(rateLimitRecord, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
      ttlSeconds,
    );
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = fieldErrors.name?.[0] ?? fieldErrors.email?.[0] ?? fieldErrors.password?.[0];
    return NextResponse.json(
      {
        error: firstError ?? "Invalid signup details.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const cookieResponse = NextResponse.json({ ok: true });

  try {
    const supabase = await createSupabaseRouteClient(cookieResponse);
    const name = normalizeName(parsed.data.name);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name },
      },
    });

    if (error) {
      if (isAuthNetworkError(error)) {
        return NextResponse.json(
          { error: "Unable to reach authentication. Try again." },
          { status: 503 },
        );
      }
      await store.set(
        key,
        getUpdatedRateLimitRecord(rateLimitRecord, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
        ttlSeconds,
      );
      const duplicate = /already/i.test(error.message);
      return NextResponse.json(
        { error: duplicate ? "Unable to create account." : error.message },
        { status: 400 },
      );
    }

    await store.del(key);

    if (!data.session || !data.user) {
      return withCookies(
        cookieResponse,
        NextResponse.json({
          user: null,
          redirectTo: "/login?checkEmail=1",
          needsEmailConfirmation: true,
        }),
      );
    }

    const email = data.user.email ?? parsed.data.email;
    return withCookies(
      cookieResponse,
      NextResponse.json({
        user: {
          id: data.user.id,
          name,
          email,
          role: "ADMIN",
        },
        redirectTo: "/onboarding",
      }),
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Signup failed", error);
    if (isAuthNetworkError(error)) {
      return NextResponse.json(
        { error: "Unable to reach authentication. Try again." },
        { status: 503 },
      );
    }
    await store.set(
      key,
      getUpdatedRateLimitRecord(rateLimitRecord, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
      ttlSeconds,
    );
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
