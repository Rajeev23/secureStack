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
   * Child active state. `prefix` highlights `/projects/:id` on nested routes
   * like `/projects/:id/connect`. Defaults to exact match.
   */
  match?: "exact" | "prefix";
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
