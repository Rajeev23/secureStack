import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/server/supabase/env";
import { supabaseFetch } from "@/server/supabase/fetch";

export function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

function userIdFromClaims(sub: unknown): string | null {
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

/**
 * Used only when `needsProxyAuthLookup` is true (protected route + session cookie).
 * Do not abort Auth here — a short timeout on getClaims caused the same 401/503
 * as aborting login.
 */
export async function getProxyAuthState(request: NextRequest): Promise<{
  userId: string | null;
  supabaseResponse: NextResponse;
}> {
  const env = getSupabasePublicEnv();
  let supabaseResponse = NextResponse.next({ request });

  if (!env) {
    return { userId: null, supabaseResponse };
  }

  const supabase = createServerClient(env.url, env.publicKey, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      return { userId: null, supabaseResponse };
    }
    return { userId: userIdFromClaims(data?.claims?.sub), supabaseResponse };
  } catch {
    return { userId: null, supabaseResponse };
  }
}
