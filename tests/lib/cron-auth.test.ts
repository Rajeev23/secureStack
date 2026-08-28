import { afterEach, describe, expect, it } from "vitest";
import { isValidCronRequest } from "@/lib/auth/cron";

const SECRET = "cron-secret-value-16";

describe("isValidCronRequest", () => {
  const previous = process.env.CRON_SECRET;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  });

  it("rejects requests when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET;
    const request = new Request("http://localhost/api/cron/scans", {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(isValidCronRequest(request)).toBe(false);
  });

  it("accepts a matching bearer token or x-cron-secret header", () => {
    process.env.CRON_SECRET = SECRET;
    expect(
      isValidCronRequest(
        new Request("http://localhost/api/cron/scans", {
          headers: { Authorization: `Bearer ${SECRET}` },
        }),
      ),
    ).toBe(true);
    expect(
      isValidCronRequest(
        new Request("http://localhost/api/cron/scans", {
          headers: { "x-cron-secret": SECRET },
        }),
      ),
    ).toBe(true);
    expect(
      isValidCronRequest(
        new Request("http://localhost/api/cron/scans", {
          headers: { Authorization: "Bearer wrong-secret-value" },
        }),
      ),
    ).toBe(false);
  });
});
