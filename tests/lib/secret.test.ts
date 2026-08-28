import { describe, expect, it } from "vitest";

describe("encryptSecret", () => {
  it("round-trips plaintext", async () => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "test-encryption-key-value";
    const { decryptSecret, encryptSecret } = await import("@/lib/crypto/secret");
    const payload = encryptSecret("gho_example_token");
    expect(decryptSecret(payload)).toBe("gho_example_token");
  });
});
