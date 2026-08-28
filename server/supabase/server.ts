import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireSupabasePublicEnv } from "@/server/supabase/env";
import { supabaseFetch } from "@/server/supabase/fetch";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Session reads (`getClaims`). Public/anonymous traffic never reaches this:
 * `proxy.ts` skips lookup, and `getSessionUserId` returns null with no cookie.
 * Do not abort fetches here — that turned working logins into 401/503.
 */
export async function createSupabaseServerClient() {
  const { url, publicKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publicKey, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — proxy.ts refreshes the session.
        }
      },
    },
  });
}

/** Login, signup, logout, and password routes. Must not abort Auth. */
export async function createSupabaseRouteClient(response: NextResponse) {
  const { url, publicKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publicKey, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore if cookies() is read-only in this context
          }
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
