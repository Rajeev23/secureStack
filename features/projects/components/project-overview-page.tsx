"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { EnvironmentChip, ScanStatusChip } from "@/components/shared/issue-chip";
import { Button } from "@/components/ui/button";
import { ProjectChrome } from "@/features/projects/components/project-chrome";
import { ScanScopeFields } from "@/features/projects/components/scan-scope-fields";
import { useProject, useUpdateProjectMonitoring } from "@/features/projects/hooks/use-projects";
import { useProjectFindings } from "@/features/findings/hooks/use-findings";
import { useImportSbom, useProjectComponents, useProjectScans, useStartScan } from "@/features/scans/hooks/use-scans";
import { ApiError } from "@/lib/api/errors";
import type { Project } from "@/features/projects/model";

type ProjectOverviewPageProps = {
  projectId: string;
};

export function ProjectOverviewPage({ projectId }: ProjectOverviewPageProps) {
  const { data: project } = useProject(projectId);
  const scansQuery = useProjectScans(projectId);
  const componentsQuery = useProjectComponents(projectId);
  const findingsQuery = useProjectFindings(projectId);
  const startScan = useStartScan(projectId);
  const importSbom = useImportSbom(projectId);
  const updateMonitoring = useUpdateProjectMonitoring(projectId);
  const [draftMode, setDraftMode] = useState<Project["scanMode"] | null>(null);
  const [draftFiles, setDraftFiles] = useState<string[] | null>(null);
  const connected = Boolean(project?.repositories.length);
  const repository = project?.repositories[0];

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

  const latest = scansQuery.data?.[0];
  const findings = findingsQuery.data ?? [];
  const isOpenFinding = (status: string) =>
    status === "OPEN" || status === "ACKNOWLEDGED" || status === "IN_PROGRESS";
  const securityCount = findings.filter(
    (finding) => finding.findingType === "SECURITY" && isOpenFinding(finding.status),
  ).length;
  const availableUpdates = componentsQuery.data?.availableUpdates ?? [];
  const securityUpdateCount = availableUpdates.filter(
    (item) => item.hasSecurityFix || (item.cves?.length ?? 0) > 0,
  ).length;

  const scanMode = draftMode ?? project?.scanMode ?? "full";
  const watchFiles = draftFiles ?? project?.files ?? [];
  const dirty =
    Boolean(project) &&
    (scanMode !== project?.scanMode || watchFiles.join("\0") !== (project?.files ?? []).join("\0"));

  return (
    <ProjectChrome projectId={projectId} active="overview">
      <div className="rounded-xl border bg-card p-6">
        {connected && repository && project ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
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
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">Files to monitor</p>
                <ScanScopeFields
                  fullName={repository.fullName}
                  branch={repository.branch}
                  scanMode={scanMode}
                  files={watchFiles}
                  onScanModeChange={(mode) => setDraftMode(mode)}
                  onFilesChange={(files) => setDraftFiles(files)}
                  disabled={updateMonitoring.isPending}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    updateMonitoring.isPending ||
                    !dirty ||
                    (scanMode === "selected" && watchFiles.length === 0)
                  }
                  onClick={() => {
                    void updateMonitoring
                      .mutateAsync({ scanMode, files: watchFiles })
                      .then(() => {
                        setDraftMode(null);
                        setDraftFiles(null);
                        toast.success("Scan scope saved. Start a scan to apply it.");
                      })
                      .catch((error) => {
                        toast.error(
                          error instanceof ApiError ? error.message : "Unable to update scan scope.",
                        );
                      });
                  }}
                >
                  {updateMonitoring.isPending ? "Saving…" : "Save scan scope"}
                </Button>
              </div>
            </div>

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

            {latest?.status === "failed" ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Scan failed</p>
                <p className="mt-1 text-muted-foreground">{latest.error ?? "Unable to read repository."}</p>
                <Button className="mt-3" size="sm" onClick={() => void onStartScan()}>
                  Retry
                </Button>
              </div>
            ) : null}
          </div>
        ) : project ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect GitHub to scan the repository, or upload a CycloneDX / SPDX JSON SBOM to build inventory
              without a git remote.
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
                      environment: event.target.value as "production" | "staging" | "development" | "unknown",
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
        ) : null}
      </div>
    </ProjectChrome>
  );
}
