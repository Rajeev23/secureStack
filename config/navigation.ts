import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CircleUser,
  FolderKanban,
  LayoutDashboard,
  SlidersHorizontal,
  Settings,
} from "lucide-react";
import type { NavGroup, NavItem } from "@/types/navigation";

const settingsChildren: NavItem[] = [
  { title: "Account", href: "/settings/account", icon: CircleUser },
  { title: "Company", href: "/settings/company", icon: Building2 },
  { title: "Preferences", href: "/settings/preferences", icon: SlidersHorizontal },
];

export const primaryNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Settings",
    icon: Settings,
    children: settingsChildren,
  },
];

export const secondaryNavigation: NavItem[] = [
  {
    title: "Documentation",
    href: "/documentation",
    icon: BookOpen,
    external: true,
    trailingIcon: ArrowUpRight,
  },
];

export const navigationGroups: NavGroup[] = [
  { title: "Application", items: primaryNavigation },
  { items: secondaryNavigation },
];
