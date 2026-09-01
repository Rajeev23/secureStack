import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

type NavIcon = ComponentType<LucideProps>;

export type NavItem = {
  title: string;
  href?: string;
  icon?: NavIcon;
  trailingIcon?: NavIcon;
  badge?: string | number;
  children?: NavItem[];
  items?: NavItem[];
  disabled?: boolean;
  /** Opens in a new tab (e.g. public documentation). */
  external?: boolean;
  /**
   * Child active state. `prefix` highlights `/projects/:id/overview` on nested
   * routes like `/projects/:id/inventory`. Defaults to exact match.
   */
  match?: "exact" | "prefix";
  /**
   * When `false`, hide this item from nav lists that use `visibleNavItems`
   * (app sidebar, command menu). Omitted or `true` means visible.
   */
  visible?: boolean;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
