"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConnectRepositories, useGithubRepositories, useProject } from "@/features/projects/hooks/use-projects";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useCompanyContextStore } from "@/stores/company-context-store";

type ConnectProjectPageProps = {
  projectId: string;
};

export function ConnectProjectPage({ projectId }: ConnectProjectPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrateCompany = useCompanyContextStore((state) => state.hydrateFromApi);
  const company = useCompanyContextStore((state) => state.company);
  const companyStatus = useCompanyContextStore((state) => state.status);
  const githubConnected = Boolean(company?.githubConnected);
  const { data: project, isLoading, isError, refetch } = useProject(projectId);
  const reposQuery = useGithubRepositories(githubConnected);
  const connect = useConnectRepositories(projectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const githubParam = searchParams.get("github");
  const githubReason = searchParams.get("reason");

  useEffect(() => {
    if (companyStatus === "idle") {
      void hydrateCompany();
    }
  }, [companyStatus, hydrateCompany]);

  useEffect(() => {
    if (githubParam === "connected") {
      toast.success("GitHub connected.");
      void hydrateCompany();
    }
    if (githubParam === "error") {
      toast.error(
        githubReason === "invalid_state"
          ? "GitHub connection expired. Try again."
          : "GitHub connection failed. Reconnect GitHub.",
      );
    }
  }, [githubParam, githubReason, hydrateCompany]);

  const currentRepoId = project?.repositories[0]?.repositoryId ?? null;
  const effectiveSelectedId = selectedId ?? currentRepoId;

  const selectedRepo = useMemo(() => {
    return (reposQuery.data ?? []).find((repo) => String(repo.id) === effectiveSelectedId) ?? null;
  }, [reposQuery.data, effectiveSelectedId]);

  const onConnectRepo = async () => {
    if (!selectedRepo) return;
    try {
      await connect.mutateAsync([
        {
          provider: "github",
          repositoryId: String(selectedRepo.id),
          fullName: selectedRepo.fullName,
          url: selectedRepo.htmlUrl,
          branch: selectedRepo.defaultBranch,
        },
      ]);
      toast.success("Repository connected. Start a scan from the project page when you’re ready.");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to connect the repository.");
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <ErrorState
        title="Unable to load project"
        description="The project may not exist or your session expired."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const connectHref = `/api/github/connect?returnTo=${encodeURIComponent(`/projects/${projectId}/connect`)}`;
  const replacing = Boolean(project.repositories.length);

  return (
    <div className="dashboard-page mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={replacing ? "Change repository" : "Connect repository"}
        description={`Choose one GitHub repository for ${project.name}.`}
      />

      {!githubConnected ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            SecureStack needs permission to list and read your GitHub repositories. Tokens stay on
            the server. If you go back, refresh, or cancel, this project stays here so you can
            finish connecting.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button render={<a href={connectHref} />}>
              <GitBranch className="size-4" aria-hidden />
              Connect GitHub
            </Button>
            <Button render={<Link href="/projects" />} variant="ghost">
              Back to projects
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Connected as <span className="font-medium text-foreground">{company?.githubAccountLogin}</span>
            . Select one repository.
          </p>

          {reposQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : reposQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">Unable to list repositories.</p>
              <Button render={<a href={connectHref} />} variant="outline">
                Reconnect GitHub
              </Button>
            </div>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto" role="radiogroup" aria-label="GitHub repositories">
              {(reposQuery.data ?? []).map((repo) => {
                const id = String(repo.id);
                const checked = effectiveSelectedId === id;
                return (
                  <li key={repo.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50",
                        checked && "bg-muted/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="github-repository"
                        className="mt-1 size-4 accent-primary"
                        checked={checked}
                        onChange={() => setSelectedId(id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{repo.fullName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {repo.private ? "Private" : "Public"} · {repo.defaultBranch}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!selectedRepo || connect.isPending}
              onClick={() => {
                void onConnectRepo();
              }}
            >
              {connect.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Connecting…
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden />
                  {replacing ? "Save repository" : "Connect repository"}
                </>
              )}
            </Button>
            <Button render={<a href={connectHref} />} variant="outline">
              Reconnect GitHub
            </Button>
            <Button render={<Link href="/projects" />} variant="ghost">
              Back to projects
            </Button>
            <Button render={<Link href={`/projects/${projectId}?connect=skip`} />} variant="ghost">
              Continue without GitHub
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
