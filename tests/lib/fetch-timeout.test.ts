import { describe, expect, it } from "vitest";
import { AUTH_FETCH_TIMEOUT_MS, isAuthNetworkError, withTimeout } from "@/lib/auth/fetch-timeout";

describe("withTimeout", () => {
  it("resolves when the work finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
  });

  it("rejects when the work does not finish in time", async () => {
    await expect(
      withTimeout(new Promise(() => undefined), 20),
    ).rejects.toThrow("Auth lookup timed out.");
  });
});

describe("isAuthNetworkError", () => {
  it("treats aborted Auth fetches as a network failure", () => {
    expect(isAuthNetworkError({ name: "AuthRetryableFetchError", status: 0, message: "fetch failed" })).toBe(
      true,
    );
    expect(isAuthNetworkError({ name: "AbortError", message: "This operation was aborted" })).toBe(true);
  });

  it("does not treat bad credentials as a network failure", () => {
    expect(
      isAuthNetworkError({ code: "invalid_credentials", message: "Invalid login credentials" }),
    ).toBe(false);
  });
});

describe("AUTH_FETCH_TIMEOUT_MS", () => {
  it("fails frozen Auth calls before the UI can spin for minutes", () => {
    expect(AUTH_FETCH_TIMEOUT_MS).toBe(10_000);
  });
});
