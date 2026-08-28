type EnvMap = Record<string, string | undefined>;

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. See docs/supabase/README.md.`);
  }
  return value;
}

function publicKeyFromEnv(env: EnvMap): string | undefined {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabasePublicEnv(
  env: EnvMap = process.env,
): { url: string; publicKey: string } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = publicKeyFromEnv(env);
  if (!url || !publicKey) return null;
  return { url, publicKey };
}

export function requireSupabasePublicEnv(
  env: EnvMap = process.env,
): { url: string; publicKey: string } {
  const resolved = getSupabasePublicEnv(env);
  if (!resolved) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are required. See docs/supabase/README.md.",
    );
  }
  return resolved;
}

export function requireSupabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function requireAppUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}
