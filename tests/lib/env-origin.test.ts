import { describe, expect, it } from "vitest";
import { githubOAuthRedirectUri, publicAppOrigin } from "@/lib/env";

describe("publicAppOrigin", () => {
  it("prefers APP_URL", () => {
    expect(publicAppOrigin({ APP_URL: "https://scan.example.com/" })).toBe("https://scan.example.com");
  });

  it("uses VERCEL_URL when APP_URL is missing", () => {
    expect(publicAppOrigin({ VERCEL_URL: "securestack.vercel.app" })).toBe("https://securestack.vercel.app");
  });
});

describe("githubOAuthRedirectUri", () => {
  it("derives the callback from APP_URL", () => {
    expect(githubOAuthRedirectUri({ APP_URL: "https://scan.example.com" })).toBe(
      "https://scan.example.com/api/github/callback",
    );
  });

  it("ignores a localhost redirect when the site origin is live", () => {
    expect(
      githubOAuthRedirectUri({
        APP_URL: "https://securestack.vercel.app",
        GITHUB_REDIRECT_URI: "http://localhost:3000/api/github/callback",
      }),
    ).toBe("https://securestack.vercel.app/api/github/callback");
  });

  it("keeps an explicit localhost redirect for local APP_URL", () => {
    expect(
      githubOAuthRedirectUri({
        APP_URL: "http://localhost:3000",
        GITHUB_REDIRECT_URI: "http://localhost:3000/api/github/callback",
      }),
    ).toBe("http://localhost:3000/api/github/callback");
  });
});
