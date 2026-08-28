import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import {
  buildGitHubAuthorizeUrl,
  GITHUB_OAUTH_STATE_COOKIE,
  safeReturnPath,
} from "@/services/github/oauth";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", "/projects/new");
    return NextResponse.redirect(login);
  }

  const requestUrl = new URL(request.url);
  const returnTo = safeReturnPath(requestUrl.searchParams.get("returnTo"), "/projects");
  const nonce = crypto.randomUUID();
  const authorizeUrl = buildGitHubAuthorizeUrl(nonce);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    GITHUB_OAUTH_STATE_COOKIE,
    encodeURIComponent(JSON.stringify({ nonce, returnTo })),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    },
  );
  return response;
}
