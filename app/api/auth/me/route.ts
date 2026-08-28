import { NextResponse } from "next/server";
import { isAuthDevBypassEnabled } from "@/lib/auth/proxy-access";
import { getSessionUserId } from "@/lib/auth/session";
import { getAuthUserById, getDemoAuthUser, resolvePostAuthRedirect } from "@/services/api/auth";

export async function GET() {
  const userId = await getSessionUserId();
  const bypass = isAuthDevBypassEnabled();

  if (!userId && !bypass) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = userId ? await getAuthUserById(userId) : await getDemoAuthUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const redirectTo = userId ? await resolvePostAuthRedirect(userId) : "/dashboard";

    return NextResponse.json({
      user,
      redirectTo,
    });
  } catch (error) {
    console.error("Auth me failed", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
