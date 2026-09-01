export type RateLimitRecord = {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
};

export type RateLimitStore = {
  get: (key: string) => Promise<RateLimitRecord | null>;
  set: (key: string, value: RateLimitRecord, ttlSeconds: number) => Promise<void>;
  del: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, RateLimitRecord>();
const memoryExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function upstashCommand<T>(config: { url: string; token: string }, command: unknown[]): Promise<T> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash command failed: ${response.status}`);
  }

  const data = (await response.json()) as { result?: T; error?: string };
  if (data.error) {
    throw new Error(`Upstash error: ${data.error}`);
  }
  return data.result as T;
}

function createUpstashStore(config: { url: string; token: string }): RateLimitStore {
  return {
    get: async (key) => {
      const raw = await upstashCommand<string | null>(config, ["GET", key]);
      if (!raw) return null;
      return JSON.parse(raw) as RateLimitRecord;
    },
    set: async (key, value, ttlSeconds) => {
      await upstashCommand(config, ["SETEX", key, ttlSeconds, JSON.stringify(value)]);
    },
    del: async (key) => {
      await upstashCommand(config, ["DEL", key]);
    },
  };
}

function createMemoryStore(): RateLimitStore {
  return {
    get: async (key) => memoryStore.get(key) ?? null,
    set: async (key, value, ttlSeconds) => {
      memoryStore.set(key, value);

      const existingTimer = memoryExpiryTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        memoryStore.delete(key);
        memoryExpiryTimers.delete(key);
      }, ttlSeconds * 1000);

      memoryExpiryTimers.set(key, timer);
    },
    del: async (key) => {
      memoryStore.delete(key);
      const existingTimer = memoryExpiryTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
        memoryExpiryTimers.delete(key);
      }
    },
  };
}

export function getRateLimitStore(): RateLimitStore {
  const config = getUpstashConfig();
  if (config) {
    return createUpstashStore(config);
  }

  const enforce =
    process.env.NODE_ENV === "production" && process.env.ENFORCE_PRODUCTION_ENV === "true";

  if (enforce) {
    throw new Error(
      "Missing Upstash configuration. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or unset ENFORCE_PRODUCTION_ENV.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[rate-limit] Using in-memory store. Configure Upstash Redis for multi-instance deploys, or set ENFORCE_PRODUCTION_ENV=true to require it.",
    );
  }

  return createMemoryStore();
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function isRateLimitBlocked(record: RateLimitRecord | null, now: number): boolean {
  if (!record?.blockedUntil) return false;
  return record.blockedUntil > now;
}

export function getUpdatedRateLimitRecord(
  existing: RateLimitRecord | null,
  now: number,
  windowMs: number,
  maxAttempts: number,
  blockMs: number,
): RateLimitRecord {
  if (!existing || now - existing.firstAttemptAt > windowMs) {
    return { count: 1, firstAttemptAt: now };
  }

  const count = existing.count + 1;
  return {
    ...existing,
    count,
    blockedUntil: count >= maxAttempts ? now + blockMs : undefined,
  };
}
