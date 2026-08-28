import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AUTH_DEV_BYPASS: z.enum(["true", "false"]).optional(),
  ENFORCE_PRODUCTION_ENV: z.enum(["true", "false"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(16).optional(),
  ),
});

export type AppEnv = z.infer<typeof envSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

export function validateEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${formatZodError(parsed.error)}`);
  }

  if (env.NODE_ENV === "production" && env.ENFORCE_PRODUCTION_ENV === "true") {
    const hasPublicKey = Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !hasPublicKey || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase URL, publishable (or anon) key, and service role key are required in production.",
      );
    }

    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.",
      );
    }
  } else if (env.NODE_ENV === "production") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn("[env] NEXT_PUBLIC_SUPABASE_URL is not set. See docs/supabase/README.md.");
    }

    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn("[env] Upstash Redis is not configured for shared rate limiting.");
    }
  }

  return parsed.data;
}
