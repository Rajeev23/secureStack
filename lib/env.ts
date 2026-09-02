import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  APP_URL: z.string().url().optional(),
  ENFORCE_PRODUCTION_ENV: z.enum(["true", "false"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Public origin of this instance. Visitors never set this — the host / Vercel does. */
export function publicAppOrigin(env: NodeJS.ProcessEnv = process.env): string {
  const appUrl = env.APP_URL?.trim().replace(/\/$/, "");
  if (appUrl) return appUrl;
  const vercel = env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function requireAppUrl(): string {
  return publicAppOrigin();
}

/** GitHub OAuth callback. Ignores a localhost GITHUB_REDIRECT_URI when the site is live. */
export function githubOAuthRedirectUri(env: NodeJS.ProcessEnv = process.env): string {
  const origin = publicAppOrigin(env);
  const fallback = `${origin}/api/github/callback`;
  const explicit = env.GITHUB_REDIRECT_URI?.trim();
  if (!explicit) return fallback;

  try {
    const explicitUrl = new URL(explicit);
    const originUrl = new URL(origin);
    if (isLocalHostname(explicitUrl.hostname) && !isLocalHostname(originUrl.hostname)) {
      return fallback;
    }
    return explicit.replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function validateEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${formatZodError(parsed.error)}`);
  }

  if (env.NODE_ENV === "production") {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      console.warn(
        "[env] GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are missing. Visitors cannot click Connect GitHub (file and SBOM scans still work).",
      );
    }
    if (!env.GITHUB_TOKEN_ENCRYPTION_KEY || env.GITHUB_TOKEN_ENCRYPTION_KEY.length < 16) {
      console.warn(
        "[env] GITHUB_TOKEN_ENCRYPTION_KEY is missing or too short. GitHub session cookies cannot be stored.",
      );
    }
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      if (env.ENFORCE_PRODUCTION_ENV === "true") {
        throw new Error(
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required when ENFORCE_PRODUCTION_ENV=true.",
        );
      }
      console.warn("[env] Upstash Redis is not configured for shared rate limiting.");
    }
  }

  return parsed.data;
}
