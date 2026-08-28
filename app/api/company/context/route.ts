import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { getCompanyContext } from "@/services/api/company";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const context = await getCompanyContext(session.userId);
    return NextResponse.json({
      company: context.company,
      onboardingStep: context.onboardingStep,
      user: context.user,
    });
  } catch (error) {
    return jsonError(error);
  }
}
