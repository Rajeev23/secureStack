import type { NavItem } from "@/types/navigation";

/** Nested sidebar names. Extra projects stay on the Projects list page. */
export const SIDEBAR_PROJECT_LIMIT = 8;

export type ProjectNavSource = {
  id: string;
  name: string;
  repositories?: { repositoryId?: string }[];
  scanScopeConfigured?: boolean;
};

export function projectNavHref(project: ProjectNavSource): string {
  if (project.repositories && project.repositories.length === 0) {
    return `/projects/${project.id}/connect`;
  }
  if (project.scanScopeConfigured === false) {
    return `/projects/${project.id}/connect`;
  }
  return `/projects/${project.id}/overview`;
}

export function projectNavChildren(projects: ProjectNavSource[]): NavItem[] | undefined {
  if (projects.length < 2) return undefined;

  const items: NavItem[] = projects.slice(0, SIDEBAR_PROJECT_LIMIT).map((project) => ({
    title: project.name,
    href: projectNavHref(project),
    match: "prefix",
  }));

  if (projects.length > SIDEBAR_PROJECT_LIMIT) {
    items.push({ title: "View all projects", href: "/projects" });
  }

  return items;
}

export function withProjectNavItems(
  items: NavItem[],
  projects: ProjectNavSource[] | undefined,
): NavItem[] {
  if (projects?.length === 0) {
    return items.filter((item) => item.href !== "/projects");
  }

  const children = projectNavChildren(projects ?? []);
  return items.map((item) => {
    if (item.href !== "/projects") return item;
    if (!children) {
      return { ...item, children: undefined, items: undefined };
    }
    return { ...item, children };
  });
}
