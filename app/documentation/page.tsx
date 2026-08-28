import type { Metadata } from "next";
import { hrefFromSlug, loadDocByHref } from "@/features/documentation/lib/docs";
import { DocumentationPage } from "@/features/documentation/components/documentation-page";

export function generateMetadata(): Metadata {
  const doc = loadDocByHref(hrefFromSlug());
  return {
    title: doc?.title ?? "Documentation",
    description:
      doc?.description ??
      "Developer guides for SecureStack — company accounts, scanning, and UI.",
  };
}

export default function Page() {
  return <DocumentationPage />;
}
