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

export function getBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const allItems = navigationGroups.flatMap((group) => group.items);
  const trail =
    findNavTrail(allItems, pathname) ?? findNavTrailPrefix(allItems, pathname);

  if (trail) {
    const lastWithHref = [...trail].reverse().find((item) => item.href);
    if (
      lastWithHref?.href &&
      pathname !== lastWithHref.href &&
      pathname.startsWith(`${lastWithHref.href}/`)
    ) {
      const rest = pathname.slice(lastWithHref.href.length).split("/").filter(Boolean);
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
