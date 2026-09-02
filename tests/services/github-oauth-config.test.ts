import { afterEach, describe, expect, it } from "vitest";

const originalId = process.env.GITHUB_CLIENT_ID;
const originalSecret = process.env.GITHUB_CLIENT_SECRET;

afterEach(() => {
  process.env.GITHUB_CLIENT_ID = originalId;
  process.env.GITHUB_CLIENT_SECRET = originalSecret;
});

describe("hasGitHubOAuthConfig", () => {
  it("is false when the OAuth app env is missing", async () => {
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    const { hasGitHubOAuthConfig } = await import("@/services/github/oauth");
    expect(hasGitHubOAuthConfig()).toBe(false);
  });

  it("is true when client id and secret are set", async () => {
    process.env.GITHUB_CLIENT_ID = "client";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    const { hasGitHubOAuthConfig } = await import("@/services/github/oauth");
    expect(hasGitHubOAuthConfig()).toBe(true);
  });
});
