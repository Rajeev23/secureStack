import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthDevBypassEnabled, resolveProxyAccessDecision } from "@/lib/auth/proxy-access";

function applyAccessDecision(
  request: NextRequest,
  decision: ReturnType<typeof resolveProxyAccessDecision>,
) {
  if (decision === "allow") {
    return NextResponse.next({ request });
  }

  if (decision === "redirect-dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return applyAccessDecision(
    request,
    resolveProxyAccessDecision({
      pathname,
      isAuthenticated: false,
      authBypassEnabled: isAuthDevBypassEnabled(),
    }),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
