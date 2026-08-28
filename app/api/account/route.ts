import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { nameSchema } from "@/lib/company/names";
import { getAuthUserById, updateAuthUserName } from "@/services/api/auth";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const user = await getAuthUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  name: nameSchema,
});

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const user = await updateAuthUserName(session.userId, parsed.data.name);
    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error, "Unable to update account.");
  }
}
