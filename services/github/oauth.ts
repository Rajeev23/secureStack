import { requireAppUrl } from "@/lib/env";

/** Classic OAuth has no read-only private-repo scope. `repo` is required to list and clone private repos; scans never write. */
export const GITHUB_OAUTH_SCOPES = "read:user repo";
export const GITHUB_OAUTH_STATE_COOKIE = "github_oauth_state";

export function getGitHubOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${requireAppUrl()}/api/github/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required. See README.md.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGitHubAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getGitHubOAuthConfig();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", GITHUB_OAUTH_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");
  return url.toString();
}

export async function exchangeGitHubCode(code: string): Promise<{
  accessToken: string;
  tokenType: string;
  scope: string;
}> {
  const { clientId, clientSecret, redirectUri } = getGitHubOAuthConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "GitHub authorization failed.");
  }

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type ?? "bearer",
    scope: payload.scope ?? GITHUB_OAUTH_SCOPES,
  };
}

export type GithubOauthState = {
  nonce: string;
  returnTo: string;
};

export function parseOauthStateCookie(value: string | undefined): GithubOauthState | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as GithubOauthState;
    if (!parsed.nonce || !parsed.returnTo) return null;
    if (!parsed.returnTo.startsWith("/") || parsed.returnTo.startsWith("//")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function safeReturnPath(input: string | null, fallback: string): string {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return fallback;
  }
  try {
    const parsed = new URL(input, "http://localhost");
    if (parsed.origin !== "http://localhost") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
