import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { DomainError } from "@/lib/errors";
import { readJsonBody } from "@/lib/request-body";
import { getGitHubAuthenticatedUser, listGitHubRepositories } from "@/services/github/api";
import {
  buildGitHubAuthorizeUrl,
  GITHUB_OAUTH_STATE_COOKIE,
  hasGitHubOAuthConfig,
  safeReturnPath,
} from "@/services/github/oauth";
import {
  clearGitHubSessionCookie,
  hasGithubEncryptionKey,
  resolveGitHubSessionToken,
  setGitHubSessionCookie,
} from "@/services/github/session-token";
import {
  enforceSessionGithubReadRateLimit,
  enforceSessionGithubWriteRateLimit,
} from "@/services/session-scan/rate-limit";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("connect") === "1") {
    const limited = await enforceSessionGithubWriteRateLimit(request);
    if (limited) return limited;
    const returnTo = safeReturnPath(requestUrl.searchParams.get("returnTo"), "/scan");
    if (!hasGithubEncryptionKey() || !hasGitHubOAuthConfig()) {
      const url = new URL(returnTo, request.url);
      url.searchParams.set("github", "error");
      url.searchParams.set("reason", "oauth_not_configured");
      return NextResponse.redirect(url);
    }
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

  const limited = await enforceSessionGithubReadRateLimit(request);
  if (limited) return limited;

  try {
    const session = await resolveGitHubSessionToken();
    const oauthConfigured = hasGitHubOAuthConfig() && hasGithubEncryptionKey();

    if (!session) {
      return NextResponse.json({
        connected: false,
        login: null,
        source: null,
        oauthConfigured,
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
      oauthConfigured,
      repositories,
    });
  } catch (error) {
    return jsonError(error, "Unable to list GitHub repositories.");
  }
}

export async function POST(request: Request) {
  const limited = await enforceSessionGithubWriteRateLimit(request);
  if (limited) return limited;

  try {
    const body = await readJsonBody<{ token?: unknown }>(request, {});
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
