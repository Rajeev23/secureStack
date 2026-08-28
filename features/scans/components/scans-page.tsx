"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageHeader } from "@/components/shared/page-header";
import { ScanStatusChip } from "@/components/shared/issue-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyScans } from "@/features/scans/hooks/use-scans";
import { scanSourceLabel } from "@/lib/scan-source";

export function ScansPage() {
  const { data, isLoading, isError, refetch } = useCompanyScans();

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Scans"
        description="Manual and scheduled scans across this company’s projects."
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load scans"
          description="Check your session and try again."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : data?.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {data.map((scan) => (
            <li key={scan.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm">
              <div>
                <Link href={`/projects/${scan.projectId}`} className="font-medium hover:text-primary">
                  {scan.projectName}
                </Link>
                <p className="text-muted-foreground">
                  {scanSourceLabel(scan.source)} ·{" "}
                  {scan.completedAt
                    ? formatDistanceToNow(new Date(scan.completedAt), { addSuffix: true })
                    : formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                  {scan.status === "completed" ? ` · ${scan.findingsFound} findings` : null}
                  {scan.error ? ` · ${scan.error}` : null}
                </p>
              </div>
              <ScanStatusChip status={scan.status} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">No scans yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a project and start a scan, or run due projects from Company settings.
          </p>
        </div>
      )}
    </div>
  );
}
