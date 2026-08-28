"use client";

import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/features/projects/model";
import { projectHomeHref, projectRepositoryName } from "@/features/projects/model";

type ProjectsTableProps = {
  projects: Project[];
  loading?: boolean;
  removingId?: string | null;
  onRemove: (project: Project) => void;
};

export function ProjectsTable({
  projects,
  loading = false,
  removingId = null,
  onRemove,
}: ProjectsTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Projects</caption>
        <thead className="border-b bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5 font-medium">Name</th>
            <th className="px-5 py-2.5 font-medium">Environment</th>
            <th className="px-5 py-2.5 font-medium">Repository</th>
            <th className="px-5 py-2.5 font-medium">Added</th>
            <th className="px-5 py-2.5 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {projects.map((project) => {
            const added = new Date(project.createdAt);
            const repository = projectRepositoryName(project) ?? "Not connected";
            return (
              <tr
                key={project.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => router.push(projectHomeHref(project))}
              >
                <td className="px-5 py-4">
                  <p className="font-medium">{project.name}</p>
                  {project.description ? (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  ) : null}
                </td>
                <td className="px-5 py-4 capitalize text-muted-foreground">
                  {project.environment && project.environment !== "unknown" ? project.environment : "—"}
                </td>
                <td className="px-5 py-4 text-muted-foreground">{repository}</td>
                <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                  <span title={formatDistanceToNow(added, { addSuffix: true })}>
                    {format(added, "d MMM yyyy")}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${project.name}`}
                    disabled={removingId === project.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(project);
                    }}
                  >
                    {removingId === project.id ? "Removing…" : "Remove"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
