import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api/handle-error";
import { requireSession } from "@/lib/auth/session";
import { attachProjectRepositories, deleteProject, getProject, updateProjectMonitoring } from "@/services/api/projects";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const { id } = await context.params;

  try {
    const project = await getProject(session.userId, id);
    return NextResponse.json({ project });
  } catch (error) {
    return jsonError(error);
  }
}

const connectSchema = z.object({
  repositories: z
    .array(
      z.object({
        provider: z.literal("github"),
        repositoryId: z.string().min(1),
        fullName: z.string().min(1),
        url: z.string().url(),
        branch: z.string().min(1),
      }),
    )
    .length(1, "Connect one GitHub repository."),
});

const patchSchema = z.union([
  connectSchema,
  z
    .object({
      monitoringEnabled: z.boolean().optional(),
      environment: z.enum(["production", "staging", "development", "unknown"]).optional(),
    })
    .refine((value) => value.monitoringEnabled !== undefined || value.environment !== undefined, {
      message: "No changes provided.",
    }),
]);

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    if ("repositories" in parsed.data) {
      const project = await attachProjectRepositories(session.userId, id, parsed.data.repositories);
      return NextResponse.json({ project });
    }
    const project = await updateProjectMonitoring(session.userId, id, {
      enabled: parsed.data.monitoringEnabled,
      environment: parsed.data.environment,
    });
    return NextResponse.json({ project });
  } catch (error) {
    return jsonError(error, "Unable to update project.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const { id } = await context.params;

  try {
    await deleteProject(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Unable to remove project.");
  }
}
