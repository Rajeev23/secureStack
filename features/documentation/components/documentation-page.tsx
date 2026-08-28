import { notFound } from "next/navigation";
import { CatalogArticle } from "@/features/documentation/catalog/catalog-article";
import { DocArticle, DocLayout } from "@/components/doc-layout";
import { findDocsLink } from "@/features/documentation/data/docs-nav";
import { hrefFromSlug, loadDocFromLink } from "@/features/documentation/lib/docs";

export function DocumentationPage({ slug }: { slug?: string[] }) {
  const href = hrefFromSlug(slug);
  const link = findDocsLink(href);
  if (!link) notFound();

  const doc = loadDocFromLink(link);

  if (link.catalog) {
    return (
      <DocLayout headings={doc.headings}>
        <CatalogArticle doc={doc} catalogId={link.catalog} />
      </DocLayout>
    );
  }

  return (
    <DocLayout headings={doc.headings}>
      <DocArticle doc={doc} />
    </DocLayout>
  );
}
