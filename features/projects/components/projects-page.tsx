"use client";

import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProjectsTable } from "@/features/projects/components/projects-table";
import { useDeleteProject, useProjects } from "@/features/projects/hooks/use-projects";
import type { Project } from "@/features/projects/model";
import { ApiError } from "@/lib/api/errors";

function AddProjectButton() {
  return (
    <Button render={<Link href="/projects/new" />}>
      <Plus className="size-4" aria-hidden />
      Add Project
    </Button>
  );
}

export function ProjectsPage() {
  const { data, isLoading, isError, refetch } = useProjects();
  const removeProject = useDeleteProject();

  const onRemove = async (project: Project) => {
    try {
      await removeProject.mutateAsync(project.id);
      toast.success(`${project.name} removed.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to remove project.");
    }
  };

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Projects"
        description="Each project connects to one GitHub repository."
        actions={data?.length ? <AddProjectButton /> : undefined}
      />

      {isError ? (
        <ErrorState
          title="Unable to load projects"
          description="Check your session and try again."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !isLoading && !data?.length ? (
        <EmptyState
          icon={FolderKanban}
          title="Add your first project"
          description="Create a project, then connect the GitHub repository you want SecureStack to read."
          action={<AddProjectButton />}
          className="min-h-80 bg-card"
        />
      ) : (
        <ProjectsTable
          projects={data ?? []}
          loading={isLoading}
          removingId={removeProject.isPending ? (removeProject.variables ?? null) : null}
          onRemove={(project) => {
            void onRemove(project);
          }}
        />
      )}
    </div>
  );
}
