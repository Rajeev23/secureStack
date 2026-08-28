import type { Metadata } from "next";
import { hrefFromSlug, listDocHrefs, loadDocByHref, DOCS_BASE_PATH } from "@/features/documentation/lib/docs";
import { DocumentationPage } from "@/features/documentation/components/documentation-page";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return listDocHrefs()
    .filter((href) => href !== DOCS_BASE_PATH)
    .map((href) => ({
      slug: href.replace(`${DOCS_BASE_PATH}/`, "").split("/"),
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = loadDocByHref(hrefFromSlug(slug));
  return {
    title: doc?.title ?? "Documentation",
    description: doc?.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <DocumentationPage slug={slug} />;
}
