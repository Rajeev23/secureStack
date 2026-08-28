import { describe, expect, it } from "vitest";
import { displayNameFromEmail, slugifyCompanyName } from "@/lib/company/slug";

describe("slugifyCompanyName", () => {
  it("produces a lowercase slug with a unique suffix", () => {
    const slug = slugifyCompanyName("Acme Technologies");
    expect(slug.startsWith("acme-technologies-")).toBe(true);
    expect(slug.length).toBeGreaterThan("acme-technologies-".length);
  });
});

describe("displayNameFromEmail", () => {
  it("capitalizes the local part", () => {
    expect(displayNameFromEmail("wolf@example.com")).toBe("Wolf");
  });
});
