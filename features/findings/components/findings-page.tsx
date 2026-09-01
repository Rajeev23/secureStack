"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { FindingsTable } from "@/features/findings/components/findings-table";
import { findingsFromSession, sessionInventoryHref } from "@/features/scan-session/lib/derive";
import { useHydratedScanSession } from "@/features/scan-session/hooks/use-hydrated-scan-session";

export function FindingsPage() {
  const { scan, hydrated } = useHydratedScanSession();
  const findings = scan ? findingsFromSession(scan) : [];

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Findings"
        description="Security advisories, outdated packages, and end-of-life software from this scan."
        actions={
          <Button render={<Link href="/scan" />} variant="outline" size="sm">
            New scan
          </Button>
        }
      />

      <FindingsTable
        findings={findings}
        isLoading={!hydrated}
        hrefFor={(finding) => sessionInventoryHref(finding.componentName)}
        emptyDescription="Scan GitHub or upload a file to match CVEs, outdated packages, and end-of-life software."
      />
    </div>
  );
}
