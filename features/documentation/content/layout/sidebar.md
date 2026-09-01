---
title: Sidebar
description: How AppSidebar reads nested groups and Lucide icons from config/navigation.ts.
lastUpdated: 2026-09-01
related:
  - href: /documentation/layout/workspaces
    title: Session label
    description: Brand shown above the nav.
  - href: /documentation/boilerplate-patterns
    title: Project patterns
    description: Add the route before you register the href.
---

The app sidebar is **config-driven**. You add a `NavItem` in `config/navigation.ts`, give it a Lucide icon, and (for nested sections) pass `children` or `items`.

Primary nav is **Dashboard**, **Scan**, **Report**, and **Settings**. Report is the inventory list at `/inventory`. Settings opens preferences (`/settings/preferences`) with no nested children. `/updates` and `/findings` still exist but are not in the sidebar.

**Documentation** is a secondary nav item. Set `visible: true` (default) to show it in the sidebar and on the public home header/footer. Set `visible: false` to hide those links. The `/documentation` site itself stays available at the URL.

Package pages are `/inventory/:name`. Breadcrumbs show **Report** and the package name, including scoped names.

## How it is wired

```
config/navigation.ts          NavItem[] + NavGroup[]
        ↓
components/layout/sidebar/app-sidebar.tsx
  TeamSwitcher                SecureStack brand
  NavMain                     primaryNavigation
  NavSecondary                secondaryNavigation
  NavUser                     New scan / Clear scan
```

`AppSidebar` only composes those pieces. Nesting, active states, and collapsed flyout menus live in `nav-collapsible.tsx` and `nav-utils.ts`.
