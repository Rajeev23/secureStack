import type { NavItem } from "@/types/navigation";

export function getNavChildren(item: NavItem): NavItem[] {
  return item.items ?? item.children ?? [];
}

/** Stable React key for nav rows (title alone is not unique across siblings). */
export function getNavItemKey(item: NavItem, index: number): string {
  return [item.href ?? "group", item.title, index].join("::");
}

/** `/projects/:id/overview` is the project home; siblings share that prefix. */
function navPrefix(href: string): string {
  return href.endsWith("/overview") ? href.slice(0, -"/overview".length) : href;
}

/** Top-level nav links — exact match or nested routes (e.g. /users/123). */
export function isPathActive(pathname: string, href?: string) {
  if (!href) return false;
  if (pathname === href) return true;
  const prefix = navPrefix(href);
  if (prefix === "/") return false;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Collapsible child links — exact match only so siblings don't share active state. */
export function isExactPathActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.match === "prefix") {
    return isPathActive(pathname, item.href);
  }
  return isExactPathActive(pathname, item.href);
}

export function hasActiveDescendant(pathname: string, item: NavItem): boolean {
  if (item.href && isNavItemActive(pathname, item)) {
    return true;
  }

  return getNavChildren(item).some((child) => hasActiveDescendant(pathname, child));
}

export function isNavSectionActive(pathname: string, item: NavItem) {
  if (item.href && isPathActive(pathname, item.href)) {
    return true;
  }
  return hasActiveDescendant(pathname, item);
}
