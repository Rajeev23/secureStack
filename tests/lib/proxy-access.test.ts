import { describe, expect, it } from "vitest";
import { resolveProxyAccessDecision } from "@/lib/proxy-access";

describe("resolveProxyAccessDecision", () => {
  it("allows the public product without a session", () => {
    expect(resolveProxyAccessDecision({ pathname: "/" })).toBe("allow");
    expect(resolveProxyAccessDecision({ pathname: "/dashboard" })).toBe("allow");
    expect(resolveProxyAccessDecision({ pathname: "/scan" })).toBe("allow");
    expect(resolveProxyAccessDecision({ pathname: "/documentation" })).toBe("allow");
  });

  it("sends leftover auth routes to the dashboard", () => {
    expect(resolveProxyAccessDecision({ pathname: "/login" })).toBe("redirect-dashboard");
    expect(resolveProxyAccessDecision({ pathname: "/signup" })).toBe("redirect-dashboard");
    expect(resolveProxyAccessDecision({ pathname: "/onboarding" })).toBe("redirect-dashboard");
    expect(resolveProxyAccessDecision({ pathname: "/forgot-password" })).toBe("redirect-dashboard");
    expect(resolveProxyAccessDecision({ pathname: "/reset-password" })).toBe("redirect-dashboard");
    expect(resolveProxyAccessDecision({ pathname: "/auth/callback" })).toBe("redirect-dashboard");
  });
});
