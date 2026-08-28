import { describe, expect, it, vi } from "vitest";
import {
  expireSupabaseAuthCookies,
  hasSupabaseAuthCookie,
  isSupabaseAuthCookieName,
  isSupabaseAuthStorageCookieName,
  needsProxyAuthLookup,
  resolveProxyAccessDecision,
} from "@/lib/auth/proxy-access";

describe("resolveProxyAccessDecision", () => {
  it("allows public routes", () => {
    expect(
      resolveProxyAccessDecision({
        pathname: "/",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
    expect(
      resolveProxyAccessDecision({
        pathname: "/forgot-password",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
    expect(
      resolveProxyAccessDecision({
        pathname: "/reset-password",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
    expect(
      resolveProxyAccessDecision({
        pathname: "/auth/callback",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
  });

  it("keeps signed-in users on the reset-password page", () => {
    expect(
      resolveProxyAccessDecision({
        pathname: "/reset-password",
        isAuthenticated: true,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
  });

  it("sends anonymous users to login for dashboard routes", () => {
    expect(
      resolveProxyAccessDecision({
        pathname: "/dashboard",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("redirect-login");
  });

  it("sends signed-in users away from login", () => {
    expect(
      resolveProxyAccessDecision({
        pathname: "/login",
        isAuthenticated: true,
        authBypassEnabled: false,
      }),
    ).toBe("redirect-dashboard");
  });
});

describe("Supabase auth cookies", () => {
  it("recognizes session cookies and ignores PKCE verifier cookies", () => {
    expect(isSupabaseAuthCookieName("sb-abc-auth-token")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-abc-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-abc-auth-token-code-verifier")).toBe(false);
    expect(isSupabaseAuthStorageCookieName("sb-abc-auth-token-code-verifier")).toBe(true);
    expect(isSupabaseAuthCookieName("theme")).toBe(false);
    expect(hasSupabaseAuthCookie([{ name: "sb-abc-auth-token" }])).toBe(true);
    expect(hasSupabaseAuthCookie([{ name: "sb-abc-auth-token-code-verifier" }])).toBe(false);
  });

  it("expires session and PKCE cookies on logout without touching other cookies", () => {
    const set = vi.fn();
    const expired = expireSupabaseAuthCookies(
      [
        { name: "sb-abc-auth-token.0" },
        { name: "sb-abc-auth-token.1" },
        { name: "sb-abc-auth-token-code-verifier" },
        { name: "theme" },
      ],
      set,
      false,
    );

    expect(expired).toEqual([
      "sb-abc-auth-token.0",
      "sb-abc-auth-token.1",
      "sb-abc-auth-token-code-verifier",
    ]);
    expect(set).toHaveBeenCalledTimes(3);
    expect(set).toHaveBeenCalledWith(
      "sb-abc-auth-token.0",
      "",
      expect.objectContaining({ path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: false }),
    );
    expect(set).not.toHaveBeenCalledWith("theme", expect.anything(), expect.anything());
  });
});

describe("needsProxyAuthLookup", () => {
  it("never waits on Auth for anonymous or public requests", () => {
    expect(
      needsProxyAuthLookup({
        pathname: "/",
        hasSessionCookie: false,
        authBypassEnabled: false,
      }),
    ).toBe(false);
    expect(
      needsProxyAuthLookup({
        pathname: "/login",
        hasSessionCookie: false,
        authBypassEnabled: false,
      }),
    ).toBe(false);
    expect(
      needsProxyAuthLookup({
        pathname: "/dashboard",
        hasSessionCookie: false,
        authBypassEnabled: false,
      }),
    ).toBe(false);
    expect(
      needsProxyAuthLookup({
        pathname: "/",
        hasSessionCookie: true,
        authBypassEnabled: false,
      }),
    ).toBe(false);
    expect(
      needsProxyAuthLookup({
        pathname: "/api/auth/me",
        hasSessionCookie: true,
        authBypassEnabled: false,
      }),
    ).toBe(false);
  });

  it("verifies a session cookie on protected routes only", () => {
    expect(
      needsProxyAuthLookup({
        pathname: "/dashboard",
        hasSessionCookie: true,
        authBypassEnabled: false,
      }),
    ).toBe(true);
    expect(
      needsProxyAuthLookup({
        pathname: "/login",
        hasSessionCookie: true,
        authBypassEnabled: false,
      }),
    ).toBe(false);
    expect(
      needsProxyAuthLookup({
        pathname: "/signup",
        hasSessionCookie: true,
        authBypassEnabled: false,
      }),
    ).toBe(false);
    expect(
      needsProxyAuthLookup({
        pathname: "/dashboard",
        hasSessionCookie: true,
        authBypassEnabled: true,
      }),
    ).toBe(false);
  });
});
