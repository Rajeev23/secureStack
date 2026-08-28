/** Optional Auth Admin fallback after login already succeeded. Never used to abort sign-in. */
export const AUTH_LOOKUP_TIMEOUT_MS = 4_000;

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Auth lookup timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Abort / fetch failure from supabase-js. Not invalid credentials. */
export function isAuthNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; message?: string; status?: number; code?: string };
  if (candidate.code === "invalid_credentials" || candidate.code === "email_not_confirmed") {
    return false;
  }
  if (candidate.status === 0) return true;
  if (candidate.name === "AbortError" || candidate.name === "AuthRetryableFetchError") return true;
  return /abort|timed out|fetch failed|failed to fetch|network/i.test(candidate.message ?? "");
}
