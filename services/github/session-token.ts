import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decryptSecret, encryptSecret, resolveGithubEncryptionSecret } from "@/lib/crypto/secret";
import { DomainError } from "@/lib/errors";

export const GITHUB_SESSION_COOKIE = "ss_github";
const COOKIE_MAX_AGE = 60 * 60;

type GithubSessionPayload = {
  v: 1;
  accessToken: string;
  login: string;
};

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function hasGithubEncryptionKey(): boolean {
  return Boolean(resolveGithubEncryptionSecret());
}

export function envGitHubToken(): string | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  return token ? token : null;
}

export function setGitHubSessionCookie(response: NextResponse, payload: { accessToken: string; login: string }) {
  if (!hasGithubEncryptionKey()) {
    throw new DomainError(
      "GITHUB_TOKEN_ENCRYPTION_KEY is required to connect GitHub (min 16 characters).",
      503,
    );
  }
  const value: GithubSessionPayload = {
    v: 1,
    accessToken: payload.accessToken,
    login: payload.login,
  };
  response.cookies.set(GITHUB_SESSION_COOKIE, encryptSecret(JSON.stringify(value)), cookieOptions(COOKIE_MAX_AGE));
}

export function clearGitHubSessionCookie(response: NextResponse) {
  response.cookies.set(GITHUB_SESSION_COOKIE, "", cookieOptions(0));
}

function parsePayload(raw: string | undefined): GithubSessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decryptSecret(raw)) as GithubSessionPayload;
    if (parsed.v !== 1 || !parsed.accessToken || !parsed.login) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readGitHubSessionCookie(): Promise<GithubSessionPayload | null> {
  const store = await cookies();
  return parsePayload(store.get(GITHUB_SESSION_COOKIE)?.value);
}

export type ResolvedGitHubToken = {
  accessToken: string;
  login: string;
  source: "cookie" | "env";
};

export async function resolveGitHubSessionToken(): Promise<ResolvedGitHubToken | null> {
  const cookie = await readGitHubSessionCookie();
  if (cookie) {
    return { accessToken: cookie.accessToken, login: cookie.login, source: "cookie" };
  }
  const envToken = envGitHubToken();
  if (envToken) {
    return { accessToken: envToken, login: "GITHUB_TOKEN", source: "env" };
  }
  return null;
}
