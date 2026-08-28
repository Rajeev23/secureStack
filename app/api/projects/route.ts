import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { nameSchema } from "@/lib/company/names";
import { createProject, listProjects } from "@/services/api/projects";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const projects = await listProjects(session.userId);
    return NextResponse.json({ projects });
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(500).optional(),
  environment: z.enum(["production", "staging", "development", "unknown"]).optional(),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const project = await createProject(session.userId, parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Unable to create project.");
  }
}
