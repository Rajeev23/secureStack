import { describe, expect, it } from "vitest";
import { nameFromUserMetadata } from "@/lib/auth/display-name";

describe("nameFromUserMetadata", () => {
  it("uses a trimmed name from metadata", () => {
    expect(nameFromUserMetadata({ name: "  Jane Doe  " }, "jane@example.com")).toBe("Jane Doe");
  });

  it("falls back to the email local part", () => {
    expect(nameFromUserMetadata({}, "wolf@example.com")).toBe("Wolf");
  });
});
