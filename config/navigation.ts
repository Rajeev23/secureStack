import {
  ArrowUpRight,
  BookOpen,
  FolderSearch,
  LayoutDashboard,
  ScanSearch,
  Settings,
} from "lucide-react";
import type { NavGroup, NavItem } from "@/types/navigation";

/** Omitted `visible` means the item is shown. */
export function isNavItemVisible(item: { visible?: boolean }): boolean {
  return item.visible !== false;
}

export function visibleNavItems(items: NavItem[]): NavItem[] {
  return items.filter(isNavItemVisible);
}

export const primaryNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Scan",
    href: "/scan",
    icon: ScanSearch,
  },
  {
    title: "Report",
    href: "/inventory",
    icon: FolderSearch,
  },
  {
    title: "Settings",
    href: "/settings/preferences",
    icon: Settings,
  },
];

export const documentationNavItem: NavItem = {
  title: "Documentation",
  href: "/documentation",
  icon: BookOpen,
  external: true,
  trailingIcon: ArrowUpRight,
  visible: false,
};

export const secondaryNavigation: NavItem[] = [documentationNavItem];

export const isDocumentationVisible = isNavItemVisible(documentationNavItem);

export const navigationGroups: NavGroup[] = [
  { title: "Application", items: primaryNavigation },
  { items: secondaryNavigation },
];
