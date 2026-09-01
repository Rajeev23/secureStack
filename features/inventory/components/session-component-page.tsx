"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ComponentDetailView } from "@/features/inventory/components/component-detail-view";
import { findSessionComponent } from "@/features/scan-session/lib/derive";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";

export function SessionComponentPage({ name }: { name: string }) {
  const { scan, hydrated } = useHydratedScanSession();

  if (!hydrated) {
    return (
      <div className="dashboard-page space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="dashboard-page space-y-6">
        <PageHeader title={name} description="Scan a repository first to open this package." />
        <Button render={<Link href="/scan" />}>Scan</Button>
      </div>
    );
  }

  const component = findSessionComponent(scan, name);
  if (!component) {
    notFound();
  }

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title={component.name}
        description={`${component.version}${component.latestVersion ? ` → ${component.latestVersion}` : ""}`}
        actions={
          <Button render={<Link href="/inventory" />} variant="outline" size="sm">
            Report
          </Button>
        }
      />
      <div className="rounded-xl border bg-card p-5">
        <ComponentDetailView component={component} />
      </div>
    </div>
  );
}
