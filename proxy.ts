import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveProxyAccessDecision } from "@/lib/proxy-access";

function applyAccessDecision(
  request: NextRequest,
  decision: ReturnType<typeof resolveProxyAccessDecision>,
) {
  if (decision === "allow") {
    return NextResponse.next({ request });
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return applyAccessDecision(request, resolveProxyAccessDecision({ pathname }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
