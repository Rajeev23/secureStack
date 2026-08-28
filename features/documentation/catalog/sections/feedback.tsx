"use client";

import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageSkeleton } from "@/components/feedback/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogPreview } from "@/features/documentation/catalog/catalog-preview";

export function CatalogFeedback() {
  return (
    <>
      <CatalogPreview
        id="skeleton"
        title="Skeleton"
        purpose="Reserve space while data loads so the layout does not jump."
        code={`<Skeleton className="h-8 w-48" />
<Skeleton className="h-28 rounded-xl" />`}
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </CatalogPreview>

      <CatalogPreview
        id="empty-state"
        title="Empty state"
        purpose="Explain what is missing and the next action. Never leave a blank screen."
        code={`<EmptyState
  icon={FolderKanban}
  title="No components yet"
  description="Connect a Git repository or upload an SBOM to get started."
  action={<Button>Connect repository</Button>}
/>`}
      >
        <EmptyState
          icon={FolderKanban}
          title="No components yet"
          description="Connect a Git repository or upload an SBOM to get started."
          action={<Button>Connect repository</Button>}
          className="w-full"
        />
      </CatalogPreview>

      <CatalogPreview
        id="error-state"
        title="Error state"
        purpose="Say what failed and how to recover. Include a retry control when the request can be repeated."
        code={`<ErrorState
  title="Something went wrong"
  description="Unable to load components. Try again."
  onRetry={() => undefined}
/>`}
      >
        <ErrorState
          title="Something went wrong"
          description="Unable to load components. Try again."
          onRetry={() => undefined}
        />
      </CatalogPreview>

      <CatalogPreview
        id="loading-state"
        title="Loading state"
        purpose="Full-page placeholder used by app/(dashboard)/loading.tsx."
        code={`<PageSkeleton />`}
      >
        <div className="w-full overflow-hidden rounded-xl border">
          <PageSkeleton />
        </div>
      </CatalogPreview>
    </>
  );
}
