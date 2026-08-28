import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseFetch } from "@/server/supabase/fetch";

describe("supabaseFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("disables Next.js fetch caching on outbound Auth/DB calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await supabaseFetch("https://example.supabase.co/auth/v1/health", { method: "GET" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/health",
      expect.objectContaining({
        cache: "no-store",
        method: "GET",
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
