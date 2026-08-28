import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { isAuthDevBypassEnabled } from "@/lib/auth/proxy-access";
import { requireSession } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/lib/auth/signup-schema";
import { DomainError } from "@/lib/errors";
import { createSupabaseRouteClient } from "@/server/supabase/server";
import { resolvePostAuthRedirect } from "@/services/api/auth";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session.ok) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password." },
      { status: 400 },
    );
  }

  const cookieResponse = NextResponse.json({ ok: true });

  if (isAuthDevBypassEnabled()) {
    return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  }

  try {
    const supabase = await createSupabaseRouteClient(cookieResponse);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      throw new DomainError(error.message, 400);
    }

    const redirectTo = await resolvePostAuthRedirect(session.userId);
    const json = NextResponse.json({ ok: true, redirectTo });
    cookieResponse.cookies.getAll().forEach((cookie) => json.cookies.set(cookie));
    return json;
  } catch (error) {
    return jsonError(error, "Unable to update password.");
  }
}
