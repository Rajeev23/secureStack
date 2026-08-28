import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CopyPageButton } from "@/components/doc-layout/copy-page-button";
import { DocMarkdown } from "@/components/doc-layout/doc-markdown";
import { DocMobileNav } from "@/components/doc-layout/doc-mobile-nav";
import { getAdjacentDocs, getDocsTrail } from "@/features/documentation/data/docs-nav";
import type { LoadedDoc } from "@/features/documentation/lib/docs";

function formatUpdated(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function DocArticle({ doc }: { doc: LoadedDoc }) {
  const trail = getDocsTrail(doc.href);
  const adjacent = getAdjacentDocs(doc.href);
  const updated = formatUpdated(doc.lastUpdated);

  return (
    <article className="min-w-0">
      <DocMobileNav />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
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
          {updated ? (
            <p className="text-sm text-muted-foreground">Last updated {updated}</p>
          ) : null}
        </div>
        <CopyPageButton markdown={doc.markdown} title={doc.title} />
      </div>

      <DocMarkdown markdown={doc.markdown} />

      {doc.related.length ? (
        <section className="mt-12 space-y-4 border-t border-border pt-8">
          <h2 className="text-lg font-semibold tracking-tight">Next steps</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {doc.related.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <p className="font-medium text-foreground">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
