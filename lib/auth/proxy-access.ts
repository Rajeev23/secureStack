export type ProxyAccessDecision = "allow" | "redirect-login" | "redirect-dashboard";

export function isAuthDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_BYPASS === "true";
}

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/documentation",
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return publicRoutes.some(
    (route) => route !== "/" && (pathname === route || pathname.startsWith(`${route}/`)),
  );
}

function isStaticOrApiPath(pathname: string): boolean {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".");
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
 * Anonymous and public requests must not wait on Auth.
 */
export function needsProxyAuthLookup({
  pathname,
  hasSessionCookie,
  authBypassEnabled,
}: {
  pathname: string;
  hasSessionCookie: boolean;
  authBypassEnabled: boolean;
}): boolean {
  if (authBypassEnabled) return false;
  if (isStaticOrApiPath(pathname)) return false;
  if (!hasSessionCookie) return false;
  // Login / signup / docs must render even if a stale cookie is present.
  if (isPublicRoute(pathname)) return false;
  return true;
}

export function resolveProxyAccessDecision({
  pathname,
  isAuthenticated,
  authBypassEnabled,
}: {
  pathname: string;
  isAuthenticated: boolean;
  authBypassEnabled: boolean;
}): ProxyAccessDecision {
  const isBypassedRoute = isPublicRoute(pathname) || isStaticOrApiPath(pathname);

  if (isBypassedRoute) {
    if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
      // Dashboard layout redirects incomplete onboarding to /onboarding.
      return "redirect-dashboard";
    }
    return "allow";
  }

  if (isAuthenticated || authBypassEnabled) {
    return "allow";
  }

  return "redirect-login";
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
