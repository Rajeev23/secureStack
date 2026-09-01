export type ProxyAccessDecision = "allow" | "redirect-login" | "redirect-dashboard";

export function isAuthDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_BYPASS === "true";
}

/** `@supabase/ssr` session cookie (`sb-<ref>-auth-token` or chunked `.0`, `.1`, …). */
export function isSupabaseAuthCookieName(name: string): boolean {
  return /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
}

/** Session cookies plus PKCE verifier — all of these must be expired on logout. */
export function isSupabaseAuthStorageCookieName(name: string): boolean {
  return isSupabaseAuthCookieName(name) || /^sb-.+-auth-token-code-verifier$/.test(name);
}

export type AuthCookieExpireOptions = {
  path: "/";
  maxAge: 0;
  expires: Date;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
};

export function authCookieExpireOptions(secure = process.env.NODE_ENV === "production"): AuthCookieExpireOptions {
  return {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure,
  };
}

/** Last write on logout: expire session cookies so a failed/partial signOut cannot leave you in. */
export function expireSupabaseAuthCookies(
  cookies: Iterable<{ name: string }>,
  set: (name: string, value: string, options: AuthCookieExpireOptions) => void,
  secure = process.env.NODE_ENV === "production",
): string[] {
  const options = authCookieExpireOptions(secure);
  const expired: string[] = [];
  for (const cookie of cookies) {
    if (!isSupabaseAuthStorageCookieName(cookie.name)) continue;
    set(cookie.name, "", options);
    expired.push(cookie.name);
  }
  return expired;
}

export function hasSupabaseAuthCookie(cookies: Iterable<{ name: string }>): boolean {
  for (const cookie of cookies) {
    if (isSupabaseAuthCookieName(cookie.name)) return true;
  }
  return false;
}

/**
 * Whether the proxy must verify a session before deciding.
 * Self-host mode is public: never wait on Auth.
 */
export function needsProxyAuthLookup(): boolean {
  return false;
}

export function resolveProxyAccessDecision({
  pathname,
}: {
  pathname: string;
  isAuthenticated: boolean;
  authBypassEnabled: boolean;
}): ProxyAccessDecision {
  if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding") {
    return "redirect-dashboard";
  }
  return "allow";
}

export function getSafeInternalPath(input: string | null, fallback: string): string {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(input, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
