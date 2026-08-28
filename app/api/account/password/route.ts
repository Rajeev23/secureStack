import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { passwordSchema } from "@/lib/auth/signup-schema";
import { DomainError } from "@/lib/errors";
import { createSupabaseRouteClient } from "@/server/supabase/server";
import { z } from "zod";

const bodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordSchema,
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password." },
      { status: 400 },
    );
  }

  const cookieResponse = NextResponse.json({ ok: true });

  try {
    const supabase = await createSupabaseRouteClient(cookieResponse);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (userError || !email) {
      throw new DomainError("Unable to verify your account.", 401);
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.currentPassword,
    });
    if (verifyError) {
      throw new DomainError("Current password is incorrect.", 400);
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (error) {
      throw new DomainError(error.message, 400);
    }

    const json = NextResponse.json({ ok: true });
    cookieResponse.cookies.getAll().forEach((cookie) => json.cookies.set(cookie));
    return json;
  } catch (error) {
    return jsonError(error, "Unable to update password.");
  }
}
