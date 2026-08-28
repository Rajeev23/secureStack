import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv, requireSupabaseServiceRoleKey } from "@/server/supabase/env";

/** Service-role client. Bypasses RLS. Server-only. */
export function createSupabaseAdminClient() {
  const { url } = requireSupabasePublicEnv();
  return createClient(url, requireSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
