import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSafeInternalPath } from "@/lib/auth/proxy-access";
import { createSupabaseRouteClient } from "@/server/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeInternalPath(requestUrl.searchParams.get("next"), "/reset-password");
  const redirect = NextResponse.redirect(new URL(next, request.url));

  try {
    const supabase = await createSupabaseRouteClient(redirect);

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return redirect;
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return redirect;
    }
  } catch (error) {
    console.error("Auth callback failed", error);
  }

  const failed = new URL("/forgot-password", request.url);
  failed.searchParams.set("error", "invalid");
  return NextResponse.redirect(failed);
}
