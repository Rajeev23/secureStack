import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import {
  exchangeGitHubCode,
  GITHUB_OAUTH_STATE_COOKIE,
  parseOauthStateCookie,
} from "@/services/github/oauth";
import { saveGitHubConnection } from "@/services/api/github";

function clearStateCookie(response: NextResponse) {
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function failRedirect(request: Request, returnTo: string, reason: string) {
  const url = new URL(returnTo, request.url);
  url.searchParams.set("github", "error");
  url.searchParams.set("reason", reason);
  return clearStateCookie(NextResponse.redirect(url));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const stored = parseOauthStateCookie(cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value);
  const returnTo = stored?.returnTo ?? "/projects";

  const session = await requireSession();
  if (!session.ok) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", returnTo);
    return clearStateCookie(NextResponse.redirect(login));
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state || !stored || stored.nonce !== state) {
    return failRedirect(request, returnTo, "invalid_state");
  }

  try {
    const token = await exchangeGitHubCode(code);
    await saveGitHubConnection(session.userId, token);
    const success = new URL(returnTo, request.url);
    success.searchParams.set("github", "connected");
    return clearStateCookie(NextResponse.redirect(success));
  } catch (error) {
    console.error("GitHub callback failed", error);
    return failRedirect(request, returnTo, "github_failed");
  }
}
