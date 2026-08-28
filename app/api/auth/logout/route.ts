import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { expireSupabaseAuthCookies, isAuthDevBypassEnabled } from "@/lib/auth/proxy-access";
import { createSupabaseRouteClient } from "@/server/supabase/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  const existingCookies = cookieStore.getAll();

  if (!isAuthDevBypassEnabled()) {
    try {
      const supabase = await createSupabaseRouteClient(response);
      await supabase.auth.signOut({ scope: "global" });
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  expireSupabaseAuthCookies(existingCookies, (name, value, options) => {
    try {
      cookieStore.set(name, value, options);
    } catch {
      // cookies() can be read-only in some contexts
    }
    response.cookies.set(name, value, options);
  });

  return response;
}
