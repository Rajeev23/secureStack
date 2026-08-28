import { describe, expect, it } from "vitest";
import { getSupabasePublicEnv, requireSupabasePublicEnv } from "@/server/supabase/env";

const url = "https://example.supabase.co";

describe("getSupabasePublicEnv", () => {
  it("prefers the publishable key over the legacy anon JWT", () => {
    expect(
      getSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-jwt",
      }),
    ).toEqual({ url, publicKey: "sb_publishable_test" });
  });

  it("falls back to the legacy anon JWT", () => {
    expect(
      getSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-jwt",
      }),
    ).toEqual({ url, publicKey: "legacy-anon-jwt" });
  });

  it("returns null when the public key is missing", () => {
    expect(getSupabasePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: url })).toBeNull();
  });
});

describe("requireSupabasePublicEnv", () => {
  it("throws when URL or public key is missing", () => {
    expect(() => requireSupabasePublicEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
