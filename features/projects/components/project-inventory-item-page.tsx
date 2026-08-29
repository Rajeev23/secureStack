"use client";

import Link from "next/link";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingsTable } from "@/features/findings/components/findings-table";
import { useProjectFindings } from "@/features/findings/hooks/use-findings";
import { ComponentDetailView } from "@/features/inventory/components/component-detail-view";
import { ProjectChrome } from "@/features/projects/components/project-chrome";
import { projectInventoryHref } from "@/features/projects/model";
import { useProjectComponent } from "@/features/scans/hooks/use-scans";

type ProjectInventoryItemPageProps = {
  projectId: string;
  name: string;
};

export function ProjectInventoryItemPage({ projectId, name }: ProjectInventoryItemPageProps) {
  const componentQuery = useProjectComponent(projectId, name);
  const findingsQuery = useProjectFindings(projectId);
  const matches = componentQuery.data?.components ?? [];
  const primary = matches[0];
  const relatedFindings = (findingsQuery.data ?? []).filter(
    (finding) => finding.componentName.toLowerCase() === name.toLowerCase(),
  );

  return (
    <ProjectChrome projectId={projectId} active="inventory">
      {componentQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : componentQuery.isError ? (
        <ErrorState
          title="Unable to load component"
          description="Scan this project, then open the package again."
          onRetry={() => {
            void componentQuery.refetch();
          }}
        />
      ) : !primary ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">{name} is not in this inventory</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been removed in the latest scan, or the name in the URL does not match a package.
          </p>
          <Link href={projectInventoryHref(projectId)} className="mt-4 inline-block text-sm text-primary hover:underline">
            Back to inventory
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <Link href={projectInventoryHref(projectId)} className="text-sm text-primary hover:underline">
              Back to inventory
            </Link>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{primary.name}</h2>
            <p className="text-sm text-muted-foreground">
              {primary.latestVersion && primary.latestVersion !== primary.version
                ? `${primary.version} → ${primary.latestVersion}`
                : `${primary.ecosystem}${primary.repository ? ` · ${primary.repository}` : ""}`}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <ComponentDetailView component={primary} />
          </div>

          {matches.length > 1 ? (
            <div className="space-y-3">
              <h3 className="font-medium">Also found in this project</h3>
              {matches.slice(1).map((component) => (
                <div
                  key={`${component.repository}:${component.ecosystem}:${component.sourceFile}:${component.version}`}
                  className="rounded-xl border bg-card p-6"
                >
                  <p className="mb-4 text-sm text-muted-foreground">
                    {component.ecosystem} · {component.repository} / {component.sourceFile}
                  </p>
                  <ComponentDetailView component={component} />
                </div>
              ))}
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="font-medium">Findings</h3>
            <FindingsTable
              findings={relatedFindings}
              isLoading={findingsQuery.isLoading}
              emptyTitle="No findings for this package"
              emptyDescription="The latest scan did not record a security, update, or EOL finding for this name."
            />
          </section>
        </div>
      )}
    </ProjectChrome>
  );
}
