import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { nameSchema } from "@/lib/company/names";
import { createCompanyForUser, getCompanyContext } from "@/services/api/company";

function serialize(context: Awaited<ReturnType<typeof getCompanyContext>>) {
  return {
    onboardingStep: context.onboardingStep,
    company: context.company,
    user: context.user,
  };
}

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    return NextResponse.json(serialize(await getCompanyContext(session.userId)));
  } catch (error) {
    return jsonError(error);
  }
}

const bodySchema = z.object({
  name: nameSchema,
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

  try {
    const context = await createCompanyForUser(session.userId, parsed.data.name);
    return NextResponse.json(serialize(context));
  } catch (error) {
    return jsonError(error, "Unable to create company.");
  }
}
