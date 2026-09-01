export type ProxyAccessDecision = "allow" | "redirect-dashboard";

const LEFTOVER_AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
]);

/** Old account URLs still redirect so bookmarks do not 404. */
export function resolveProxyAccessDecision({ pathname }: { pathname: string }): ProxyAccessDecision {
  if (LEFTOVER_AUTH_PATHS.has(pathname) || pathname.startsWith("/auth/")) {
    return "redirect-dashboard";
  }
  return "allow";
}
