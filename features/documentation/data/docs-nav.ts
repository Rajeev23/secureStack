import type { CatalogId } from "@/features/documentation/catalog/catalog-registry";

export type DocsNavLink = {
  title: string;
  href: string;
  file?: string;
  catalog?: CatalogId;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavLink[];
  /** When false, the group stays expanded (Getting started). Defaults to true. */
  collapsible?: boolean;
};

/**
 * Sidebar for in-app docs. Markdown pages set `file` (relative to
 * `features/documentation/content/`). Live UI previews set `catalog`.
 *
 * To add a markdown page: create the file, then register it here.
 * To add a catalog page: add a section under `features/documentation/catalog/`.
 */
export const docsNavigation: DocsNavGroup[] = [
  {
    title: "Getting started",
    collapsible: false,
    items: [
      { title: "Overview", href: "/documentation", file: "getting-started.md" },
      {
        title: "Project patterns",
        href: "/documentation/boilerplate-patterns",
        file: "boilerplate-patterns.md",
      },
      {
        title: "Self-host architecture",
        href: "/documentation/architecture/tenancy",
        file: "architecture/tenancy.md",
      },
      {
        title: "Scan flow",
        href: "/documentation/onboarding",
        file: "onboarding.md",
      },
      {
        title: "Scanning & inventory",
        href: "/documentation/scanning",
        file: "scanning.md",
      },
      {
        title: "Findings & intelligence",
        href: "/documentation/intelligence",
        file: "intelligence.md",
      },
      {
        title: "Scheduled monitoring",
        href: "/documentation/monitoring",
        file: "monitoring.md",
      },
      {
        title: "Data fetching",
        href: "/documentation/data-fetching",
        file: "data-fetching.md",
      },
      {
        title: "Writing docs",
        href: "/documentation/writing-docs",
        file: "writing-docs.md",
      },
    ],
  },
  {
    title: "UI components",
    items: [
      { title: "Overview", href: "/documentation/ui", file: "ui.md" },
      { title: "Button", href: "/documentation/ui/button", catalog: "actions" },
      { title: "Forms", href: "/documentation/ui/forms", catalog: "forms" },
      {
        title: "Data display",
        href: "/documentation/ui/data-display",
        catalog: "data-display",
      },
      { title: "Overlays", href: "/documentation/ui/overlays", catalog: "overlays" },
      { title: "Feedback", href: "/documentation/ui/feedback", catalog: "feedback" },
      {
        title: "Navigation",
        href: "/documentation/ui/navigation",
        catalog: "navigation",
      },
    ],
  },
  {
    title: "Layout",
    items: [
      { title: "Sidebar", href: "/documentation/layout/sidebar", file: "layout/sidebar.md" },
      {
        title: "Session label",
        href: "/documentation/layout/workspaces",
        file: "layout/workspaces.md",
      },
    ],
  },
];

export function isDocsGroupCollapsible(group: DocsNavGroup): boolean {
  return group.collapsible !== false;
}

export function flattenDocsLinks(groups: DocsNavGroup[] = docsNavigation): DocsNavLink[] {
  return groups.flatMap((group) => group.items);
}

export function findDocsLink(href: string): DocsNavLink | undefined {
  return flattenDocsLinks().find((item) => item.href === href);
}

export function getDocsTrail(href: string): { group: string; item: DocsNavLink } | null {
  for (const group of docsNavigation) {
    const item = group.items.find((entry) => entry.href === href);
    if (item) return { group: group.title, item };
  }
  return null;
}

export function getAdjacentDocs(href: string): {
  prev: DocsNavLink | null;
  next: DocsNavLink | null;
} {
  const links = flattenDocsLinks();
  const index = links.findIndex((item) => item.href === href);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: links[index - 1] ?? null,
    next: links[index + 1] ?? null,
  };
}
