import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { DomainError } from "@/lib/errors";
import { getGitHubAuthenticatedUser, listGitHubRepositories } from "@/services/github/api";
import {
  buildGitHubAuthorizeUrl,
  GITHUB_OAUTH_STATE_COOKIE,
  safeReturnPath,
} from "@/services/github/oauth";
import {
  clearGitHubSessionCookie,
  hasGithubEncryptionKey,
  resolveGitHubSessionToken,
  setGitHubSessionCookie,
} from "@/services/github/session-token";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("connect") === "1") {
    if (!hasGithubEncryptionKey()) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN_ENCRYPTION_KEY is required to connect GitHub (min 16 characters)." },
        { status: 503 },
      );
    }
    const returnTo = safeReturnPath(requestUrl.searchParams.get("returnTo"), "/scan");
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

  try {
    const session = await resolveGitHubSessionToken();
    if (!session) {
      return NextResponse.json({
        connected: false,
        login: null,
        source: null,
        repositories: [],
      });
    }

    const [user, repositories] = await Promise.all([
      session.source === "env"
        ? getGitHubAuthenticatedUser(session.accessToken).catch(() => ({ login: session.login }))
        : Promise.resolve({ login: session.login }),
      listGitHubRepositories(session.accessToken),
    ]);

    return NextResponse.json({
      connected: true,
      login: user.login,
      source: session.source,
      repositories,
    });
  } catch (error) {
    return jsonError(error, "Unable to list GitHub repositories.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      throw new DomainError("Paste a GitHub personal access token with repo read access.", 400);
    }
    if (!hasGithubEncryptionKey()) {
      throw new DomainError(
        "GITHUB_TOKEN_ENCRYPTION_KEY is required to hold a GitHub token for this session (min 16 characters).",
        503,
      );
    }

    const user = await getGitHubAuthenticatedUser(token);
    const response = NextResponse.json({ connected: true, login: user.login, source: "cookie" });
    setGitHubSessionCookie(response, { accessToken: token, login: user.login });
    return response;
  } catch (error) {
    return jsonError(error, "Unable to use that GitHub token.");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ connected: false });
  clearGitHubSessionCookie(response);
  return response;
}
