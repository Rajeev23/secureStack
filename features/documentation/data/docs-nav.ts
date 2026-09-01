export type DocsNavLink = {
  title: string;
  href: string;
  file: string;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavLink[];
  /** When false, the group stays expanded. Defaults to true. */
  collapsible?: boolean;
};

/**
 * Sidebar for in-app docs. Markdown pages set `file` (relative to
 * `features/documentation/content/`).
 */
export const docsNavigation: DocsNavGroup[] = [
  {
    title: "Getting started",
    collapsible: false,
    items: [
      { title: "Overview", href: "/documentation", file: "getting-started.md" },
      {
        title: "Connect GitHub",
        href: "/documentation/connect",
        file: "connect.md",
      },
      {
        title: "Run a scan",
        href: "/documentation/scan",
        file: "scan.md",
      },
      {
        title: "Read the report",
        href: "/documentation/report",
        file: "report.md",
      },
    ],
  },
  {
    title: "How it works",
    collapsible: false,
    items: [
      {
        title: "Findings & intelligence",
        href: "/documentation/intelligence",
        file: "intelligence.md",
      },
      {
        title: "Self-host",
        href: "/documentation/self-host",
        file: "self-host.md",
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
