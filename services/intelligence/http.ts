const USER_AGENT = "SecureStack/0.1 (patch update intelligence)";
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { expires: number; value: unknown }>();

function cacheKey(url: string, init?: RequestInit): string {
  return `${init?.method ?? "GET"}:${url}:${typeof init?.body === "string" ? init.body : ""}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const key = cacheKey(url, init);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value as T;
  }

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...init?.headers,
      },
      signal: init?.signal ?? AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const value = (await response.json()) as T;
    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch {
    return null;
  }
}

export async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index] as T, index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
