import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_USER } from "@/lib/auth/constants";
import { hasSupabaseAuthCookie, isAuthDevBypassEnabled } from "@/lib/auth/proxy-access";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { getSupabasePublicEnv } from "@/server/supabase/env";

export async function getSessionUserId(): Promise<string | null> {
  if (!getSupabasePublicEnv()) return null;
  // Local bypass must not call Auth. A leftover session cookie + frozen GoTrue
  // would hang every dashboard /api/auth/me request.
  if (isAuthDevBypassEnabled()) return null;

  try {
    const cookieStore = await cookies();
    if (!hasSupabaseAuthCookie(cookieStore.getAll())) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error) return null;
    const sub = data?.claims?.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

export type RequireSessionResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Guard for authenticated API route handlers.
 * Returns a 401 JSON response when there is no session and auth bypass is off.
 */
export async function requireSession(): Promise<RequireSessionResult> {
  const userId = await getSessionUserId();
  if (userId) {
    return { ok: true, userId };
  }

  if (isAuthDevBypassEnabled()) {
    return { ok: true, userId: DEMO_USER.id };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
  };
}
