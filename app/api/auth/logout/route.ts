import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/server/supabase/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  try {
    const supabase = await createSupabaseRouteClient(response);
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Logout failed", error);
  }
  return response;
}
