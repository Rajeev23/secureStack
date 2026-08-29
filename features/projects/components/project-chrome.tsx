"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GitBranch, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProject, useProject } from "@/features/projects/hooks/use-projects";
import { useStartScan } from "@/features/scans/hooks/use-scans";
import { ApiError } from "@/lib/api/errors";
import {
  projectInventoryHref,
  projectNeedsConnectSetup,
  projectOverviewHref,
  projectScansHref,
} from "@/features/projects/model";
import { cn } from "@/lib/utils";

export type ProjectTab = "overview" | "inventory" | "scans";

export function ProjectPageFallback() {
  return (
    <div className="dashboard-page space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

type ProjectChromeProps = {
  projectId: string;
  active: ProjectTab;
  children: React.ReactNode;
};

function ProjectChromeContent({ projectId, active, children }: ProjectChromeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipConnect = searchParams.get("connect") === "skip";
  const { data: project, isLoading, isError, refetch } = useProject(projectId);
  const startScan = useStartScan(projectId);
  const removeProject = useDeleteProject();
  const connected = Boolean(project?.repositories.length);

  useEffect(() => {
    if (!project || !projectNeedsConnectSetup(project) || skipConnect) return;
    router.replace(`/projects/${project.id}/connect`);
  }, [project, router, skipConnect]);

  const onStartScan = async () => {
    try {
      const scan = await startScan.mutateAsync();
      if (scan.status === "failed") {
        toast.error(scan.error ?? "Scan failed. Unable to read repository.");
        return;
      }
      toast.success(
        scan.componentsFound
          ? `Scan completed. ${scan.componentsFound} components, ${scan.findingsFound} findings.`
          : "Scan completed. No dependency files found.",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to read repository.");
    }
  };

  const onRemoveProject = async () => {
    try {
      await removeProject.mutateAsync(projectId);
      toast.success("Project removed.");
      router.push("/projects");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to remove project.");
    }
  };

  if (isLoading || (project && projectNeedsConnectSetup(project) && !skipConnect)) {
    return <ProjectPageFallback />;
  }

  if (isError || !project) {
    return (
      <ErrorState
        title="Project not found"
        description="It may have been removed, or you don’t have access."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const skipQuery = skipConnect ? "?connect=skip" : "";
  const tabs: Array<{ id: ProjectTab; label: string; href: string }> = [
    { id: "overview", label: "Overview", href: `${projectOverviewHref(project.id)}${skipQuery}` },
    { id: "inventory", label: "Inventory", href: `${projectInventoryHref(project.id)}${skipQuery}` },
    { id: "scans", label: "Scans", href: `${projectScansHref(project.id)}${skipQuery}` },
  ];

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title={project.name}
        description={project.description ?? "Inventory, available updates, and what changed upstream."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {connected ? (
              <Button disabled={startScan.isPending} onClick={() => void onStartScan()}>
                {startScan.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                    Scanning repository…
                  </>
                ) : (
                  <>
                    <Play className="size-4" aria-hidden />
                    Start Scan
                  </>
                )}
              </Button>
            ) : (
              <Button render={<Link href={`/projects/${project.id}/connect`} />}>
                <GitBranch className="size-4" aria-hidden />
                Connect GitHub
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={removeProject.isPending}
              onClick={() => {
                void onRemoveProject();
              }}
            >
              {removeProject.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Removing…
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        }
      />

      <nav aria-label="Project sections" className="inline-flex h-auto flex-wrap items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "inline-flex items-center rounded-md px-3 py-1 text-sm font-medium",
              active === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground",
            )}
            aria-current={active === tab.id ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}

export function ProjectChrome(props: ProjectChromeProps) {
  return (
    <Suspense fallback={<ProjectPageFallback />}>
      <ProjectChromeContent {...props} />
    </Suspense>
  );
}
