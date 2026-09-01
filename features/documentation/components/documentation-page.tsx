import { notFound } from "next/navigation";
import { DocArticle, DocLayout } from "@/components/doc-layout";
import { findDocsLink } from "@/features/documentation/data/docs-nav";
import { hrefFromSlug, loadDocFromLink } from "@/features/documentation/lib/docs";

export function DocumentationPage({ slug }: { slug?: string[] }) {
  const href = hrefFromSlug(slug);
  const link = findDocsLink(href);
  if (!link) notFound();

  const doc = loadDocFromLink(link);

  return (
    <DocLayout headings={doc.headings}>
      <DocArticle doc={doc} />
    </DocLayout>
  );
}
