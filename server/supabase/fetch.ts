import { AUTH_FETCH_TIMEOUT_MS } from "@/lib/auth/fetch-timeout";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

function requestUrl(input: FetchInput): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function mergeAbortSignals(timeout: AbortSignal, existing?: AbortSignal): AbortSignal {
  if (!existing) return timeout;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([existing, timeout]);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (existing.aborted || timeout.aborted) {
    abort();
    return controller.signal;
  }
  existing.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

/**
 * Shared fetch for Auth and PostgREST.
 * `cache: "no-store"` keeps Next.js from caching session/JWKS GETs.
 * Only Auth (`/auth/v1/`) is hard-timed-out so Sign in cannot spin forever
 * when GoTrue is frozen. PostgREST stays unbounded.
 */
export const supabaseFetch: typeof fetch = async (input: FetchInput, init?: FetchInit) => {
  const started = Date.now();
  const method = init?.method ?? "GET";
  const url = requestUrl(input);
  const isAuthRequest = url.includes("/auth/v1/");
  const signal = isAuthRequest
    ? mergeAbortSignals(AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS), init?.signal ?? undefined)
    : (init?.signal ?? undefined);

  try {
    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      ...(signal ? { signal } : null),
    });
    const ms = Date.now() - started;
    if (ms >= 2_000) {
      console.warn(`[supabase-fetch] slow ${method} ${url} ${response.status} ${ms}ms`);
    }
    return response;
  } catch (error) {
    const ms = Date.now() - started;
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    if (timedOut) {
      console.warn(`[supabase-fetch] ${method} ${url} timed out ${ms}ms`);
    } else {
      console.error(`[supabase-fetch] ${method} ${url} failed ${ms}ms`, error);
    }
    throw error;
  }
};
