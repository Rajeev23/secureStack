import { describe, expect, it } from "vitest";
import { DomainError } from "@/lib/errors";
import { assertBodyWithinLimit, readJsonBody } from "@/lib/request-body";

describe("assertBodyWithinLimit", () => {
  it("allows bodies at the limit", () => {
    expect(() => assertBodyWithinLimit("abcd", 4)).not.toThrow();
  });

  it("rejects bodies over the limit with 413", () => {
    try {
      assertBodyWithinLimit("abcde", 4);
      throw new Error("expected DomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).status).toBe(413);
      expect((error as DomainError).message).toBe("That upload is too large.");
    }
  });
});

describe("readJsonBody", () => {
  it("parses JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ source: "sbom" }),
    });
    await expect(readJsonBody(request, {})).resolves.toEqual({ source: "sbom" });
  });

  it("returns fallback for empty or invalid JSON", async () => {
    const empty = new Request("http://localhost", { method: "POST", body: "" });
    await expect(readJsonBody(empty, { ok: true })).resolves.toEqual({ ok: true });

    const invalid = new Request("http://localhost", { method: "POST", body: "not-json" });
    await expect(readJsonBody(invalid, {})).resolves.toEqual({});
  });
});
