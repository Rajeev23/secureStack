import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasSupabaseAuthCookie,
  isAuthDevBypassEnabled,
  needsProxyAuthLookup,
  resolveProxyAccessDecision,
} from "@/lib/auth/proxy-access";
import { copyCookies, getProxyAuthState } from "@/server/supabase/proxy-session";

function applyAccessDecision(
  request: NextRequest,
  decision: ReturnType<typeof resolveProxyAccessDecision>,
  supabaseResponse = NextResponse.next({ request }),
) {
  if (decision === "allow") {
    return supabaseResponse;
  }

  if (decision === "redirect-dashboard") {
    return copyCookies(supabaseResponse, NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return copyCookies(supabaseResponse, NextResponse.redirect(loginUrl));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authBypassEnabled = isAuthDevBypassEnabled();
  const hasSessionCookie = hasSupabaseAuthCookie(request.cookies.getAll());

  if (!needsProxyAuthLookup({ pathname, hasSessionCookie, authBypassEnabled })) {
    return applyAccessDecision(
      request,
      resolveProxyAccessDecision({
        pathname,
        isAuthenticated: false,
        authBypassEnabled,
      }),
    );
  }

  const { userId, supabaseResponse } = await getProxyAuthState(request);
  return applyAccessDecision(
    request,
    resolveProxyAccessDecision({
      pathname,
      isAuthenticated: Boolean(userId),
      authBypassEnabled,
    }),
    supabaseResponse,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
