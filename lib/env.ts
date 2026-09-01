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

export function requireAppUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function validateEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${formatZodError(parsed.error)}`);
  }

  if (env.NODE_ENV === "production") {
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
