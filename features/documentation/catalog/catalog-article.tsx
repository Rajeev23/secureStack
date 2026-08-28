import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DocMobileNav } from "@/components/doc-layout/doc-mobile-nav";
import { getAdjacentDocs, getDocsTrail } from "@/features/documentation/data/docs-nav";
import type { LoadedDoc } from "@/features/documentation/lib/docs";
import type { CatalogId } from "@/features/documentation/catalog/catalog-registry";
import { CatalogActions } from "@/features/documentation/catalog/sections/actions";
import { CatalogDataDisplay } from "@/features/documentation/catalog/sections/data-display";
import { CatalogFeedback } from "@/features/documentation/catalog/sections/feedback";
import { CatalogForms } from "@/features/documentation/catalog/sections/forms";
import { CatalogNavigation } from "@/features/documentation/catalog/sections/navigation";
import { CatalogOverlays } from "@/features/documentation/catalog/sections/overlays";

const catalogSections = {
  actions: CatalogActions,
  forms: CatalogForms,
  "data-display": CatalogDataDisplay,
  overlays: CatalogOverlays,
  feedback: CatalogFeedback,
  navigation: CatalogNavigation,
} as const;

export function CatalogArticle({ doc, catalogId }: { doc: LoadedDoc; catalogId: CatalogId }) {
  const trail = getDocsTrail(doc.href);
  const adjacent = getAdjacentDocs(doc.href);
  const Section = catalogSections[catalogId];

  return (
    <article className="min-w-0">
      <DocMobileNav />

      <div className="mb-8 space-y-3">
        {trail ? (
          <nav aria-label="Documentation breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
            <span>{trail.group}</span>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            <span className="text-foreground">{trail.item.title}</span>
          </nav>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {doc.title}
        </h1>
        <p className="text-[15px] leading-7 text-muted-foreground">{doc.description}</p>
      </div>

      <div className="space-y-12">
        <Section />
      </div>

      <nav
        aria-label="Previous and next page"
        className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between"
      >
        {adjacent.prev ? (
          <Link
            href={adjacent.prev.href}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
          >
            <span className="block text-[11px] text-muted-foreground">Previous</span>
            <span className="font-medium text-foreground">{adjacent.prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link
            href={adjacent.next.href}
            className="rounded-lg border border-border px-3 py-2 text-sm sm:text-right transition-colors hover:bg-muted/40"
          >
            <span className="block text-[11px] text-muted-foreground">Next</span>
            <span className="font-medium text-foreground">{adjacent.next.title}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
