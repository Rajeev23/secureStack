---
title: Project patterns
description: Copy these when you add a feature — routes, nav, and reference pages.
lastUpdated: 2026-08-28
related:
  - href: /documentation/layout/sidebar
    title: Sidebar
    description: Nested groups, icons, and how navigation.ts drives the app sidebar.
  - href: /documentation/data-fetching
    title: Data fetching
    description: TanStack Query hooks and the API client.
---

SecureStack is in active product build. Routing, layout, navigation, and shared UI are wired so the next work can focus on Git/SBOM ingest, inventory, and patch priority.

## Why follow these patterns

The folder boundaries make changes predictable:

- route files describe URLs and metadata;
- feature modules own product pages and feature-specific UI;
- `services/` owns trusted server-side domain behavior (GitHub, scanner, intelligence, monitoring, DB orchestration);
- `lib/` holds pure helpers and client infra (auth session, API client, crypto) — not GitHub/OSV/Slack I/O;
- shared components solve interface problems used by more than one feature;
- configuration drives navigation and product-wide switches.

Following those boundaries keeps a growing dashboard easier to review, test, and hand to another developer. Copy an existing reference feature before inventing a new structure.

## Add a page

1. Create `features/<name>/components/<name>-page.tsx`
2. Export from `features/<name>/index.ts`
3. Add a thin route at `app/(dashboard)/<name>/page.tsx` with `metadata` + a re-export
4. Register the `href` in `config/navigation.ts` (icon + nest if needed)
5. Run `pnpm validate:nav`

```tsx filename="app/(dashboard)/reports/page.tsx"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Workspace reports.",
};

export { ReportsPage as default } from "@/features/reports";
```

The route file stays thin. UI lives in the feature module. See [Sidebar](/documentation/layout/sidebar) for how the `href` and icon land in the app nav.

## Feature folder

```txt filename="features/<name>/"
index.ts                 # Public exports only
components/
  <name>-page.tsx        # Page component
data/                    # Optional mock/static data
hooks/                   # Optional TanStack Query hooks
stores/                  # Optional feature-scoped Zustand state
types/                   # Optional feature types
```

Put shared client API helpers in `lib/api/`. Put GitHub, scan, and intelligence engines in `services/` — not in `lib/`.

## Reference features

| Feature | Copy this for |
| --- | --- |
| `features/dashboard/` | Greeting (first name + company subtitle), TanStack Query, scan-backed component counts |
| `features/onboarding/` | Company name setup after signup |
| `features/projects/` | Create project, GitHub OAuth, one repository per project, Start Scan, inventory / updates / findings / scans tabs |
| `features/inventory/` | Project inventory UI reused on the project page |
| `features/updates/` | Outdated packages vs latest release (project tab) |
| `features/findings/` | Security / update / EOL findings table (project tab) |
| `features/scans/` | Scan hooks and `/api/projects/:id/scans` client |
| `features/settings/` | Nested routes: Account, Company, Preferences |

The dashboard heading greets the signed-in user by **first name** (first letter capitalized). The subtitle is `Open-source software health for {company name}`. With no projects, the dashboard and Projects list show an empty state with **Add Project** — not a wall of zeros. With projects, KPIs are **Projects**, open updates, security issues, critical findings, and EOL. Below the KPIs: Recent findings, Updates, then Recent scans. Issue, severity, and status colors live in `config/issue-palette.ts`. App chrome buttons use the default size (`pill` is for marketing/auth only).

After changing product behavior, update the matching docs (see [Writing docs](/documentation/writing-docs) and `docs/DOC_MAP.md`).

## Quality checks

```bash
pnpm check
```

Runs ESLint, TypeScript, unit tests, `pnpm validate:nav`, then a production build. A Husky pre-push hook runs the same suite.
