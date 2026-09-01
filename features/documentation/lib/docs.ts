import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  docsNavigation,
  findDocsLink,
  flattenDocsLinks,
  type DocsNavLink,
} from "@/features/documentation/data/docs-nav";
import { extractHeadings, type DocHeading } from "@/features/documentation/lib/heading";
import { DOCS_BASE_PATH } from "@/features/documentation/lib/base-path";

const CONTENT_DIR = path.join(process.cwd(), "features/documentation/content");

const relatedSchema = z.object({
  href: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

function toIsoDateString(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value;
}

const frontmatterSchema = z.object({
  title: z.string(),
  description: z.string(),
  lastUpdated: z.preprocess(toIsoDateString, z.string().optional()),
  related: z.array(relatedSchema).optional(),
});

export type DocRelatedLink = z.infer<typeof relatedSchema>;

export type LoadedDoc = {
  href: string;
  file: string;
  title: string;
  description: string;
  lastUpdated?: string;
  related: DocRelatedLink[];
  markdown: string;
  headings: DocHeading[];
};

function assertInsideContentDir(filePath: string) {
  const relative = path.relative(CONTENT_DIR, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Doc path escapes content directory: ${filePath}`);
  }
}

export function resolveDocFile(file: string): string {
  const resolved = path.resolve(CONTENT_DIR, file);
  assertInsideContentDir(resolved);
  return resolved;
}

export function hrefFromSlug(slug?: string[]): string {
  if (!slug?.length) return DOCS_BASE_PATH;
  return `${DOCS_BASE_PATH}/${slug.join("/")}`;
}

export function loadDocByHref(href: string): LoadedDoc | null {
  const link = findDocsLink(href);
  if (!link) return null;
  return loadDocFromLink(link);
}

export function loadDocFromLink(link: DocsNavLink): LoadedDoc {
  const filePath = resolveDocFile(link.file);
  if (!existsSync(filePath)) {
    throw new Error(`Missing documentation file: ${link.file}`);
  }

  const raw = readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = frontmatterSchema.parse(parsed.data);

  return {
    href: link.href,
    file: link.file,
    title: frontmatter.title,
    description: frontmatter.description,
    lastUpdated: frontmatter.lastUpdated,
    related: frontmatter.related ?? [],
    markdown: parsed.content.trim(),
    headings: extractHeadings(parsed.content),
  };
}

export function listDocHrefs(): string[] {
  return flattenDocsLinks(docsNavigation).map((item) => item.href);
}

export function listMarkdownFiles(dir = CONTENT_DIR): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      return listMarkdownFiles(full);
    }
    return entry.endsWith(".md") ? [path.relative(CONTENT_DIR, full)] : [];
  });
}

export { CONTENT_DIR, DOCS_BASE_PATH };
