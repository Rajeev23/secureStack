import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv, requireSupabaseServiceRoleKey } from "@/server/supabase/env";
import { supabaseFetch } from "@/server/supabase/fetch";

/** Service-role client. Bypasses RLS. Server-only. */
export function createSupabaseAdminClient() {
  const { url } = requireSupabasePublicEnv();
  return createClient(url, requireSupabaseServiceRoleKey(), {
    global: { fetch: supabaseFetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
