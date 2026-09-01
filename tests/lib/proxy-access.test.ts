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
  it("allows the public product without a session", () => {
    expect(
      resolveProxyAccessDecision({
        pathname: "/",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
    expect(
      resolveProxyAccessDecision({
        pathname: "/dashboard",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
    expect(
      resolveProxyAccessDecision({
        pathname: "/scan",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
    expect(
      resolveProxyAccessDecision({
        pathname: "/documentation",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("allow");
  });

  it("sends leftover auth routes to the dashboard", () => {
    expect(
      resolveProxyAccessDecision({
        pathname: "/login",
        isAuthenticated: false,
        authBypassEnabled: false,
      }),
    ).toBe("redirect-dashboard");
    expect(
      resolveProxyAccessDecision({
        pathname: "/signup",
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
  });
});

describe("needsProxyAuthLookup", () => {
  it("never waits on Auth", () => {
    expect(needsProxyAuthLookup()).toBe(false);
  });
});
