"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject, useProjects } from "@/features/projects/hooks/use-projects";
import { projectNeedsGithubConnect } from "@/features/projects/model";
import { ApiError } from "@/lib/api/errors";
import { NAME_MAX_LENGTH, nameSchema } from "@/lib/company/names";

const schema = z.object({
  name: nameSchema,
  description: z.string().max(500).optional(),
  environment: z.enum(["production", "staging", "development", "unknown"]),
});

type FormValues = z.infer<typeof schema>;

export function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const { data: projects } = useProjects();
  const waiting = (projects ?? []).filter(projectNeedsGithubConnect);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", environment: "unknown" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const project = await createProject.mutateAsync({
        name: values.name,
        description: values.description?.trim() || undefined,
        environment: values.environment,
      });
      toast.success("Project created. Connect GitHub next.");
      router.replace(`/projects/${project.id}/connect`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to create project.");
    }
  };

  const busy = createProject.isPending;

  return (
    <div className="dashboard-page mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Create project"
        description="Name the application you want to monitor, then connect its GitHub repository."
      />

      {waiting.length ? (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">Finish connecting GitHub</p>
          <p className="mt-1 text-muted-foreground">
            You already started {waiting.length === 1 ? "a project" : "projects"}. Continue where you
            left off — Back, refresh, or cancel does not lose it.
          </p>
          <ul className="mt-3 space-y-2">
            {waiting.map((project) => (
              <li key={project.id}>
                <Button
                  render={<Link href={`/projects/${project.id}/connect`} />}
                  variant="outline"
                  size="sm"
                >
                  Continue {project.name}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form className="space-y-4 rounded-xl border bg-card p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            maxLength={NAME_MAX_LENGTH}
            placeholder="Payment API"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            placeholder="Optional"
            rows={3}
            {...register("description")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-environment">Environment</Label>
          <select
            id="project-environment"
            className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
            {...register("environment")}
          >
            <option value="unknown">Not set yet</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Production usage raises impact and can make a security update P1.
          </p>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Creating…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </div>
  );
}
