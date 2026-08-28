import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { nameSchema } from "@/lib/company/names";
import { getCompanyContext, updateCompany } from "@/services/api/company";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const context = await getCompanyContext(session.userId);
    if (!context.company) {
      return NextResponse.json({ error: "Finish company setup first." }, { status: 403 });
    }
    return NextResponse.json({ company: context.company });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z
  .object({
    name: nameSchema.optional(),
    scanIntervalHours: z.union([z.literal(0), z.literal(6), z.literal(12), z.literal(24), z.literal(48), z.literal(168)]).optional(),
    alertsEnabled: z.boolean().optional(),
    slackWebhookUrl: z.union([z.string().url(), z.literal("")]).optional(),
    notifyEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    digestMode: z.enum(["off", "daily", "weekly"]).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.scanIntervalHours !== undefined ||
      value.alertsEnabled !== undefined ||
      value.slackWebhookUrl !== undefined ||
      value.notifyEmail !== undefined ||
      value.digestMode !== undefined,
    { message: "No changes provided." },
  );

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
    const company = await updateCompany(session.userId, parsed.data);
    return NextResponse.json({ company });
  } catch (error) {
    return jsonError(error, "Unable to update company.");
  }
}
