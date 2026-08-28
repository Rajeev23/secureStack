import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getAuthUserById, resolvePostAuthRedirect } from "@/services/api/auth";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = await getAuthUserById(userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const redirectTo = await resolvePostAuthRedirect(userId);

    return NextResponse.json({
      user,
      redirectTo,
    });
  } catch (error) {
    console.error("Auth me failed", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
