export type ProxyAccessDecision = "allow" | "redirect-dashboard";

const LEFTOVER_AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "") || "/";
  }
  return pathname;
}

/** Old account URLs still redirect so bookmarks do not 404. */
export function resolveProxyAccessDecision({ pathname }: { pathname: string }): ProxyAccessDecision {
  const path = normalizePathname(pathname);
  if (LEFTOVER_AUTH_PATHS.has(path) || path.startsWith("/auth/")) {
    return "redirect-dashboard";
  }
  return "allow";
}
