import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getRateLimitStore,
  getRequestIp,
  getUpdatedRateLimitRecord,
  isRateLimitBlocked,
} from "@/lib/auth/rate-limit";
import { isAuthNetworkError } from "@/lib/auth/fetch-timeout";
import { getAuthUserById, resolvePostAuthRedirect } from "@/services/api/auth";
import { createSupabaseRouteClient } from "@/server/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const key = `auth:login:${ip}`;
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
      { error: "Too many failed attempts. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const { body, isFormPost } = await readLoginBody(request);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    await store.set(
      key,
      getUpdatedRateLimitRecord(rateLimitRecord, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
      ttlSeconds,
    );
    return loginFailureResponse(request, isFormPost, "Invalid credentials.", 400);
  }

  const cookieResponse = NextResponse.json({ ok: true });

  try {
    const supabase = await createSupabaseRouteClient(cookieResponse);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      if (isAuthNetworkError(error)) {
        return loginFailureResponse(
          request,
          isFormPost,
          "Unable to reach authentication. Try again.",
          503,
        );
      }
      await store.set(
        key,
        getUpdatedRateLimitRecord(rateLimitRecord, now, WINDOW_MS, MAX_ATTEMPTS, BLOCK_MS),
        ttlSeconds,
      );
      const unconfirmed =
        error?.code === "email_not_confirmed" || /not confirmed/i.test(error?.message ?? "");
      return loginFailureResponse(
        request,
        isFormPost,
        unconfirmed ? "Confirm your email before signing in." : "Invalid email or password.",
        401,
      );
    }

    await store.del(key);

    const redirectTo = await resolvePostAuthRedirect(data.user.id);
    const user = await getAuthUserById(data.user.id);

    if (isFormPost) {
      const redirect = NextResponse.redirect(new URL(redirectTo, request.url), 303);
      cookieResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }

    const json = NextResponse.json({ user, redirectTo });
    cookieResponse.cookies.getAll().forEach((cookie) => json.cookies.set(cookie));
    return json;
  } catch (error) {
    console.error("Login failed", error);
    const unavailable = isAuthNetworkError(error);
    return loginFailureResponse(
      request,
      isFormPost,
      unavailable ? "Unable to reach authentication. Try again." : "Unable to sign in.",
      unavailable ? 503 : 500,
    );
  }
}

function isFormEncoded(contentType: string): boolean {
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

async function readLoginBody(request: Request): Promise<{ body: unknown; isFormPost: boolean }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (isFormEncoded(contentType)) {
    const form = await request.formData().catch(() => null);
    return {
      isFormPost: true,
      body: form ? { email: form.get("email"), password: form.get("password") } : null,
    };
  }

  return {
    isFormPost: false,
    body: await request.json().catch(() => null),
  };
}

function loginFailureResponse(
  request: Request,
  isFormPost: boolean,
  error: string,
  status: number,
) {
  if (isFormPost) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "credentials");
    return NextResponse.redirect(loginUrl, 303);
  }

  return NextResponse.json({ error }, { status });
}
