import type { DocHeading } from "@/features/documentation/lib/heading";

type RelatedLink = {
  href: string;
  title: string;
  description?: string;
};

export type CatalogId =
  | "actions"
  | "forms"
  | "data-display"
  | "overlays"
  | "feedback"
  | "navigation";

export type CatalogEntry = {
  title: string;
  description: string;
  headings: DocHeading[];
  related?: RelatedLink[];
};

export const catalogRegistry: Record<CatalogId, CatalogEntry> = {
  actions: {
    title: "Button",
    description: "Primary actions, secondary actions, and destructive controls.",
    headings: [
      { id: "button", title: "Button", level: 2 },
      { id: "variants", title: "Variants", level: 2 },
      { id: "sizes", title: "Sizes", level: 2 },
      { id: "states", title: "States", level: 2 },
    ],
    related: [
      {
        href: "/documentation/ui/forms",
        title: "Forms",
        description: "Inputs, selects, and checkboxes used with buttons.",
      },
    ],
  },
  forms: {
    title: "Forms",
    description: "Text fields, selects, checkboxes, and labels for collecting data.",
    headings: [
      { id: "input", title: "Input", level: 2 },
      { id: "textarea", title: "Textarea", level: 2 },
      { id: "select", title: "Select", level: 2 },
      { id: "checkbox", title: "Checkbox", level: 2 },
    ],
  },
  "data-display": {
    title: "Data display",
    description: "Badges, table status, avatars, cards, and tables for structured records.",
    headings: [
      { id: "badge", title: "Badge", level: 2 },
      { id: "table-status", title: "Table status", level: 2 },
      { id: "avatar", title: "Avatar", level: 2 },
      { id: "card", title: "Card", level: 2 },
      { id: "table", title: "Table", level: 2 },
    ],
  },
  overlays: {
    title: "Overlays",
    description: "Dialogs, drawers, menus, tooltips, toasts, and the command palette.",
    headings: [
      { id: "dialog", title: "Dialog", level: 2 },
      { id: "sheet", title: "Sheet", level: 2 },
      { id: "dropdown", title: "Dropdown", level: 2 },
      { id: "tooltip", title: "Tooltip", level: 2 },
      { id: "toast", title: "Toast", level: 2 },
      { id: "command", title: "Command menu", level: 2 },
    ],
  },
  feedback: {
    title: "Feedback",
    description: "Loading, empty, and error states used across feature pages.",
    headings: [
      { id: "skeleton", title: "Skeleton", level: 2 },
      { id: "empty-state", title: "Empty state", level: 2 },
      { id: "error-state", title: "Error state", level: 2 },
      { id: "loading-state", title: "Loading state", level: 2 },
    ],
  },
  navigation: {
    title: "Navigation",
    description: "Tabs and breadcrumbs for moving between views.",
    headings: [
      { id: "tabs", title: "Tabs", level: 2 },
      { id: "breadcrumb", title: "Breadcrumb", level: 2 },
    ],
  },
};

export function getCatalogEntry(id: CatalogId): CatalogEntry {
  return catalogRegistry[id];
}
