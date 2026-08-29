---
title: Sidebar
description: How AppSidebar reads nested groups and Lucide icons from config/navigation.ts.
lastUpdated: 2026-08-29
related:
  - href: /documentation/layout/workspaces
    title: Company label
    description: Company name shown above the nav.
  - href: /documentation/boilerplate-patterns
    title: Project patterns
    description: Add the route before you register the href.
---

The app sidebar is **config-driven** for Dashboard, Projects, and Settings. You add a `NavItem` in `config/navigation.ts`, give it a Lucide icon, and (for nested sections) pass `children` or `items`.

Settings includes **Account**, **Company**, and **Preferences**. Primary nav is **Dashboard**, **Projects**, and **Settings**. **Projects** stays off the sidebar until the company has at least one project — the dashboard empty state is the add path. Inventory, updates, findings, and scans live on a project after you open it.

When the company has **two or more** projects, Projects becomes a collapsible group. The **Projects** label still opens `/projects`. Nested names open that project’s overview (up to eight). Extra projects stay on the list. One project keeps a single Projects link.

Project URLs are `/projects/:id/overview`, `/projects/:id/inventory`, `/projects/:id/inventory/:name`, and `/projects/:id/scans`. Breadcrumbs show the **project name**, not the UUID.

## How it is wired

```
config/navigation.ts          NavItem[] + NavGroup[]
config/project-nav.ts         Nested project names (cap eight)
        ↓
components/layout/sidebar/app-sidebar.tsx
  TeamSwitcher                GET /api/company/context
  NavMain                     primaryNavigation + project names from GET /api/projects
  NavSecondary                secondaryNavigation
  NavUser                     footer
```

`AppSidebar` only composes those pieces. Nesting, active states, and collapsed flyout menus live in `nav-collapsible.tsx` and `nav-utils.ts`.
