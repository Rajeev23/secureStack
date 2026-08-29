import { navigationGroups } from "@/config/navigation";
import type { BreadcrumbItem, NavItem } from "@/types/navigation";

function getNavChildren(item: NavItem): NavItem[] {
  return item.items ?? item.children ?? [];
}

function formatSegmentLabel(segment: string) {
  return segment
    .split("-")
    .map((word) => (word === "ui" ? "UI" : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function findNavTrail(
  items: NavItem[],
  pathname: string,
  trail: BreadcrumbItem[] = [],
): BreadcrumbItem[] | null {
  for (const item of items) {
    const nextTrail = [...trail, { label: item.title, href: item.href }];

    const children = getNavChildren(item);
    if (children.length) {
      const childTrail = findNavTrail(children, pathname, nextTrail);
      if (childTrail) return childTrail;
    }

    if (item.href && pathname === item.href) {
      return nextTrail;
    }
  }

  return null;
}

function findNavTrailPrefix(
  items: NavItem[],
  pathname: string,
  trail: BreadcrumbItem[] = [],
): BreadcrumbItem[] | null {
  for (const item of items) {
    const nextTrail = [...trail, { label: item.title, href: item.href }];

    const children = getNavChildren(item);
    if (children.length) {
      const childTrail = findNavTrailPrefix(children, pathname, nextTrail);
      if (childTrail) return childTrail;
    }

    if (item.href && pathname.startsWith(`${item.href}/`)) {
      return nextTrail;
    }
  }

  return null;
}

export type BreadcrumbOptions = {
  projectNames?: Record<string, string>;
};

function projectRestCrumbs(rest: string[], projectNames: Record<string, string>): BreadcrumbItem[] {
  if (rest[0] === "new") {
    return [{ label: "New project" }];
  }

  const projectId = rest[0];
  if (!projectId) return [];

  const remainder = rest.slice(1);
  const isHome = remainder.length === 0 || (remainder.length === 1 && remainder[0] === "overview");
  const projectLabel = projectNames[projectId]?.trim() || "Project";
  const overviewHref = `/projects/${projectId}/overview`;
  const crumbs: BreadcrumbItem[] = [
    { label: projectLabel, href: isHome ? undefined : overviewHref },
  ];

  if (isHome) return crumbs;

  const section = remainder[0];
  if (section === "connect") {
    crumbs.push({ label: "Connect GitHub" });
    return crumbs;
  }

  if (section === "scans") {
    crumbs.push({ label: "Scans" });
    return crumbs;
  }

  if (section === "inventory") {
    const nameParts = remainder.slice(1);
    crumbs.push({
      label: "Inventory",
      href: nameParts.length ? `/projects/${projectId}/inventory` : undefined,
    });
    if (nameParts.length) {
      crumbs.push({ label: nameParts.map((part) => decodeURIComponent(part)).join("/") });
    }
    return crumbs;
  }

  remainder.forEach((segment, index) => {
    if (segment === "overview") return;
    crumbs.push({
      label: formatSegmentLabel(decodeURIComponent(segment)),
      href: index < remainder.length - 1 ? `/projects/${projectId}/${remainder.slice(0, index + 1).join("/")}` : undefined,
    });
  });
  return crumbs;
}

export function getBreadcrumbsFromPath(
  pathname: string,
  options: BreadcrumbOptions = {},
): BreadcrumbItem[] {
  const allItems = navigationGroups.flatMap((group) => group.items);
  const trail =
    findNavTrail(allItems, pathname) ?? findNavTrailPrefix(allItems, pathname);
  const projectNames = options.projectNames ?? {};

  if (trail) {
    const lastWithHref = [...trail].reverse().find((item) => item.href);
    if (
      lastWithHref?.href &&
      pathname !== lastWithHref.href &&
      pathname.startsWith(`${lastWithHref.href}/`)
    ) {
      const rest = pathname.slice(lastWithHref.href.length).split("/").filter(Boolean);
      if (lastWithHref.href === "/projects") {
        return [...trail, ...projectRestCrumbs(rest, projectNames)];
      }
      return [
        ...trail,
        ...rest.map((segment, index) => {
          const href = `${lastWithHref.href}/${rest.slice(0, index + 1).join("/")}`;
          const label = formatSegmentLabel(segment);
          return {
            label,
            href: index < rest.length - 1 ? href : undefined,
          };
        }),
      ];
    }
    return trail;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = formatSegmentLabel(segment);
    return { label, href: index < segments.length - 1 ? href : undefined };
  });
}
