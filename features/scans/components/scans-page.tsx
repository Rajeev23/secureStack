"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { ScanStatusChip } from "@/components/shared/issue-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";
import { scanSourceLabel } from "@/lib/scan-source";

export function ScansPage() {
  const { scan, hydrated } = useHydratedScanSession();

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Scans"
        description="This browser session holds one scan. Nothing is stored on a server."
        actions={
          <Button render={<Link href="/scan" />} variant="outline" size="sm">
            New scan
          </Button>
        }
      />

      {!hydrated ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : scan ? (
        <ul className="divide-y rounded-xl border bg-card">
          <li className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm">
            <div>
              <p className="font-medium">{scan.label}</p>
              <p className="text-muted-foreground">
                {scanSourceLabel(scan.source)} · {scan.findingsFound} findings ·{" "}
                {formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true })}
              </p>
            </div>
            <ScanStatusChip status="completed" />
          </li>
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-medium">No scan in this tab</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/scan" className="text-primary hover:underline">
              Scan GitHub or upload a file
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
