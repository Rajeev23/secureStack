import { describe, expect, it } from "vitest";

describe("encryptSecret", () => {
  it("round-trips plaintext", async () => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "test-encryption-key-value";
    const { decryptSecret, encryptSecret } = await import("@/lib/crypto/secret");
    const payload = encryptSecret("gho_example_token");
    expect(decryptSecret(payload)).toBe("gho_example_token");
  });

  it("uses a local development key when the env key is missing", async () => {
    delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    process.env.NODE_ENV = "test";
    const { decryptSecret, encryptSecret, resolveGithubEncryptionSecret } = await import(
      "@/lib/crypto/secret"
    );
    expect(resolveGithubEncryptionSecret()).toBeTruthy();
    const payload = encryptSecret("gho_local_pat");
    expect(decryptSecret(payload)).toBe("gho_local_pat");
  });

  it("does not use the development key in production", async () => {
    const { resolveGithubEncryptionSecret } = await import("@/lib/crypto/secret");
    expect(resolveGithubEncryptionSecret({ NODE_ENV: "production" })).toBeNull();
  });
});
