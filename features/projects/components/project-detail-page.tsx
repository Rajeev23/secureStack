"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, Loader2, Play, Upload } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { ChangeKindChip, DependencyTierChip, EnvironmentChip, ScanStatusChip, SeverityChip } from "@/components/shared/issue-chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteProject, useProject, useUpdateProjectMonitoring } from "@/features/projects/hooks/use-projects";
import { FindingsTable } from "@/features/findings/components/findings-table";
import { useProjectFindings } from "@/features/findings/hooks/use-findings";
import { ComponentDetailDialog, type ComponentDetail } from "@/features/inventory/components/component-detail-dialog";
import { IntelligenceBadges } from "@/features/inventory/components/intelligence-badges";
import { TransitiveNote } from "@/features/inventory/components/transitive-note";
import { UpdateFeedList } from "@/features/updates/components/update-feed-list";
import { fetchProjectComponents } from "@/features/scans/api/client";
import type { ScanComponent } from "@/features/scans/model";
import { useProjectComponents, useProjectScans, useImportSbom, useStartScan } from "@/features/scans/hooks/use-scans";
import { ApiError } from "@/lib/api/errors";
import { scanSourceLabel } from "@/lib/scan-source";
import { projectNeedsGithubConnect } from "@/features/projects/model";

type ProjectDetailPageProps = {
  projectId: string;
};

function statusBadge(status: string) {
  return <ScanStatusChip status={status} />;
}

function ProjectDetailFallback() {
  return (
    <div className="dashboard-page space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function ProjectDetailPageContent({ projectId }: ProjectDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipConnect = searchParams.get("connect") === "skip";
  const [includeTransitive, setIncludeTransitive] = useState(false);
  const { data: project, isLoading, isError, refetch } = useProject(projectId);
  const scansQuery = useProjectScans(projectId);
  const componentsQuery = useProjectComponents(projectId, undefined, includeTransitive);
  const findingsQuery = useProjectFindings(projectId);
  const startScan = useStartScan(projectId);
  const importSbom = useImportSbom(projectId);
  const updateMonitoring = useUpdateProjectMonitoring(projectId);
  const removeProject = useDeleteProject();
  const [selected, setSelected] = useState<ComponentDetail | null>(null);
  const [moreComponents, setMoreComponents] = useState<{ key: string; items: ScanComponent[] }>({
    key: "",
    items: [],
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const connected = Boolean(project?.repositories.length);
  const repository = project?.repositories[0];

  useEffect(() => {
    if (!project || !projectNeedsGithubConnect(project) || skipConnect) return;
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

  const onImportSbom = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const document = JSON.parse(text) as unknown;
      const scan = await importSbom.mutateAsync(document);
      if (scan.status === "failed") {
        toast.error(scan.error ?? "SBOM import failed.");
        return;
      }
      toast.success(
        scan.componentsFound
          ? `SBOM imported. ${scan.componentsFound} components, ${scan.findingsFound} findings.`
          : "SBOM imported. No packages found.",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload a CycloneDX or SPDX JSON file.");
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

  if (isLoading || (project && projectNeedsGithubConnect(project) && !skipConnect)) {
    return <ProjectDetailFallback />;
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

  const latest = scansQuery.data?.[0];
  const pageComponents = componentsQuery.data?.components ?? [];
  const componentsKey = `${includeTransitive}:${componentsQuery.data?.scan?.id ?? ""}:${componentsQuery.data?.total ?? 0}`;
  const extraComponents = moreComponents.key === componentsKey ? moreComponents.items : [];
  const components = [...pageComponents, ...extraComponents];
  const changes = componentsQuery.data?.changes;
  const findings = findingsQuery.data ?? [];
  const isOpenFinding = (status: string) =>
    status === "OPEN" || status === "ACKNOWLEDGED" || status === "IN_PROGRESS";
  const securityCount = findings.filter(
    (finding) => finding.findingType === "SECURITY" && isOpenFinding(finding.status),
  ).length;
  const securityFindings = findings.filter((finding) => finding.findingType !== "UPDATE");
  const availableUpdates = componentsQuery.data?.availableUpdates ?? [];
  const securityUpdateCount = availableUpdates.filter(
    (item) => item.hasSecurityFix || (item.cves?.length ?? 0) > 0,
  ).length;

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

      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="changes">What&apos;s changed</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-6">
            {connected && repository ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  GitHub connected
                </p>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Repository:{" "}
                    <a
                      href={repository.url}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {repository.fullName}
                    </a>
                  </p>
                  <p className="text-muted-foreground">Branch: {repository.branch}</p>
                </div>
                <Button render={<Link href={`/projects/${project.id}/connect`} />} variant="outline" size="sm">
                  Change repository
                </Button>
                {!latest ? (
                  <p className="text-sm text-muted-foreground">
                    Repository connected. Start a scan when you&apos;re ready.
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Components</p>
                    <p className="font-heading text-xl font-semibold tabular-nums">
                      {latest?.status === "completed" ? latest.componentsFound : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Updates available</p>
                    <p className="font-heading text-xl font-semibold tabular-nums">
                      {latest?.status === "completed" ? availableUpdates.length : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Security updates</p>
                    <p className="font-heading text-xl font-semibold tabular-nums">
                      {latest?.status === "completed" ? securityUpdateCount : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Open findings</p>
                    <p className="font-heading text-xl font-semibold tabular-nums">
                      {latest?.status === "completed" ? securityCount : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Last scan</p>
                    <p className="font-medium">
                      {latest?.completedAt
                        ? formatDistanceToNow(new Date(latest.completedAt), { addSuffix: true })
                        : "Not scanned"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {latest ? <ScanStatusChip status={latest.status} /> : <p className="font-medium">Ready to scan</p>}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Environment</span>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                    value={project.environment ?? "unknown"}
                    disabled={updateMonitoring.isPending}
                    onChange={(event) => {
                      void updateMonitoring
                        .mutateAsync({
                          environment: event.target.value as
                            | "production"
                            | "staging"
                            | "development"
                            | "unknown",
                        })
                        .then(() => toast.success("Environment updated."))
                        .catch((error) => {
                          toast.error(error instanceof ApiError ? error.message : "Unable to update environment.");
                        });
                    }}
                  >
                    <option value="unknown">Unset</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                  <EnvironmentChip environment={project.environment ?? "unknown"} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={project.monitoringEnabled !== false}
                    disabled={updateMonitoring.isPending}
                    onChange={(event) => {
                      void updateMonitoring
                        .mutateAsync({ monitoringEnabled: event.target.checked })
                        .then(() => toast.success("Scheduled scanning updated."))
                        .catch((error) => {
                          toast.error(error instanceof ApiError ? error.message : "Unable to update monitoring.");
                        });
                    }}
                  />
                  Include this project in scheduled scans
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Upload className="size-4" aria-hidden />
                  <span>{importSbom.isPending ? "Importing SBOM…" : "Upload CycloneDX or SPDX JSON"}</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    disabled={importSbom.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void onImportSbom(file);
                    }}
                  />
                </label>
                {latest?.status === "failed" ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive">Scan failed</p>
                    <p className="mt-1 text-muted-foreground">
                      {latest.error ?? "Unable to read repository."}
                    </p>
                    <Button className="mt-3" size="sm" onClick={() => void onStartScan()}>
                      Retry
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect GitHub to scan the repository, or upload a CycloneDX / SPDX JSON SBOM to build
                  inventory without a git remote.
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Environment</span>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                    value={project.environment ?? "unknown"}
                    disabled={updateMonitoring.isPending}
                    onChange={(event) => {
                      void updateMonitoring
                        .mutateAsync({
                          environment: event.target.value as
                            | "production"
                            | "staging"
                            | "development"
                            | "unknown",
                        })
                        .then(() => toast.success("Environment updated."))
                        .catch((error) => {
                          toast.error(error instanceof ApiError ? error.message : "Unable to update environment.");
                        });
                    }}
                  >
                    <option value="unknown">Unset</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
                  <Upload className="size-4" aria-hidden />
                  {importSbom.isPending ? "Importing SBOM…" : "Upload SBOM"}
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    disabled={importSbom.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void onImportSbom(file);
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 space-y-3">
          <TransitiveNote
            tiers={componentsQuery.data?.tiers}
            includeTransitive={includeTransitive}
            onToggle={setIncludeTransitive}
          />
          <div className="rounded-xl border bg-card">
            {componentsQuery.isLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : components.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No components yet. Start a scan to read dependency files and version pins from GitHub.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Open-source components discovered in this project</caption>
                  <thead className="border-b bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Component</th>
                      <th className="px-4 py-2 font-medium">Tier</th>
                      <th className="px-4 py-2 font-medium">Current</th>
                      <th className="px-4 py-2 font-medium">Latest</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Impact</th>
                      <th className="px-4 py-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((component) => (
                      <tr
                        key={`${component.repository}:${component.ecosystem}:${component.name}:${component.sourceFile}`}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                        onClick={() => setSelected(component)}
                      >
                        <td className="px-4 py-2 font-medium">{component.name}</td>
                        <td className="px-4 py-2">
                          {component.tier ? <DependencyTierChip tier={component.tier} /> : "—"}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{component.version}</td>
                        <td className="px-4 py-2 tabular-nums">{component.latestVersion ?? "—"}</td>
                        <td className="px-4 py-2">
                          <IntelligenceBadges
                            cves={component.cves}
                            versionStatus={component.versionStatus}
                            latestVersion={component.latestVersion}
                            eolStatus={component.eolStatus}
                            recommendationKind={component.recommendationKind}
                            priority={component.priority}
                            priorityWhy={component.priorityWhy}
                          />
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {component.impact && component.impact !== "none"
                            ? component.impact
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {component.repository} / {component.sourceFile}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {componentsQuery.data?.hasMore || extraComponents.length > 0 ? (
                  <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                    <p>
                      Showing {components.length}
                      {componentsQuery.data?.total != null ? ` of ${componentsQuery.data.total}` : ""}
                    </p>
                    {componentsQuery.data &&
                    components.length < componentsQuery.data.total ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingMore}
                        onClick={() => {
                          void (async () => {
                            setLoadingMore(true);
                            try {
                              const next = await fetchProjectComponents(projectId, {
                                offset: components.length,
                                limit: componentsQuery.data.limit,
                                includeTransitive,
                              });
                              setMoreComponents({
                                key: componentsKey,
                                items: [...extraComponents, ...next.components],
                              });
                            } finally {
                              setLoadingMore(false);
                            }
                          })();
                        }}
                      >
                        {loadingMore ? "Loading…" : "Load more"}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="mt-4">
          <UpdateFeedList
            items={availableUpdates}
            groups={componentsQuery.data?.transitiveGroups}
            onSelect={setSelected}
            emptyTitle="No updates waiting"
            emptyDescription="Components already on the latest scanned version stay off this list."
          />
        </TabsContent>

        <TabsContent value="changes" className="mt-4">
          <div className="space-y-4">
            {availableUpdates.length === 0 ? (
              <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                No new upstream versions since the current pins. After a scan, this tab explains what changed
                between your version and the latest release.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {availableUpdates.map((item) => {
                  const notes = item.changeSummary
                    ? [
                        item.changeSummary.security.length
                          ? `${item.changeSummary.security.length} security`
                          : null,
                        item.changeSummary.bugfix.length ? `${item.changeSummary.bugfix.length} bug fixes` : null,
                        item.changeSummary.breaking.length ? "breaking changes" : null,
                      ].filter(Boolean)
                    : [];
                  return (
                    <li key={`changed:${item.ecosystem}:${item.name}:${item.sourceFile}`}>
                      <button
                        type="button"
                        className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-muted/40"
                        onClick={() => setSelected(item)}
                      >
                        <span className="font-medium">
                          {item.name}{" "}
                          <span className="font-normal text-muted-foreground">
                            {item.version} → {item.latestVersion ?? "—"}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {notes.length
                            ? notes.join(" · ")
                            : "Release notes were not published; recommendation uses version type and advisories."}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="findings" className="mt-4">
          <FindingsTable
            findings={securityFindings}
            isLoading={findingsQuery.isLoading}
            emptyTitle="No findings"
            emptyDescription="Scan this repository to check OSV advisories and end-of-life software."
          />
        </TabsContent>

        <TabsContent value="scans" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <p className="font-medium">Since last scan</p>
            {!changes ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Scan again to compare this inventory with the previous scan.
              </p>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {changes.added.length} added · {changes.removed.length} removed · {changes.updated.length}{" "}
                  version changes · {changes.newCves.length} new CVEs
                </p>
                {changes.alerts.length ? (
                  <ul className="divide-y rounded-lg border">
                    {changes.alerts.map((alert, index) => (
                      <li key={`${alert.summary}:${index}`} className="flex items-start justify-between gap-3 px-3 py-2">
                        <span className="min-w-0 font-medium">{alert.summary}</span>
                        <span className="flex shrink-0 flex-wrap justify-end gap-1">
                          <ChangeKindChip kind={alert.kind} />
                          <SeverityChip severity={alert.severity} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No security or lifecycle alerts between scans.</p>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-card">
            {scansQuery.isLoading ? (
              <div className="p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : scansQuery.data?.length ? (
              <ul className="divide-y">
                {scansQuery.data.map((scan) => (
                  <li key={scan.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{scanSourceLabel(scan.source)} scan</p>
                      <p className="text-muted-foreground">
                        {scan.completedAt
                          ? formatDistanceToNow(new Date(scan.completedAt), { addSuffix: true })
                          : formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                        {scan.status === "completed" ? ` · ${scan.findingsFound} findings` : null}
                        {scan.error ? ` · ${scan.error}` : null}
                      </p>
                    </div>
                    {statusBadge(scan.status)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">No scans yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <ComponentDetailDialog component={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  return (
    <Suspense fallback={<ProjectDetailFallback />}>
      <ProjectDetailPageContent projectId={projectId} />
    </Suspense>
  );
}
