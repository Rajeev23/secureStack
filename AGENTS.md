<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Architecture

**SecureStack** — open-source patch and dependency update intelligence, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, and **Zustand**.

This product mode has **no companies, no users, no signup, and no required database**. A visitor connects GitHub or uploads a file and gets a report in this browser tab.

## High-level layout

```
securestack/
├── app/                  # Routes only — thin page files, layouts, loading/error
├── features/             # Feature modules — page UI, feature data, feature stores
├── services/
│   ├── github/           # GitHub OAuth + REST
│   ├── scanner/          # Manifest parse, repository walk
│   ├── intelligence/     # OSV, EOL, versions, P1–P4, recommendations
│   └── session-scan/     # Stateless GitHub / SBOM / file scans
├── components/           # Shared UI: layout shell, feedback, design-system primitives
├── config/               # Static app config (navigation, app)
├── stores/               # Global client state (sidebar, layout, command menu)
├── lib/                  # Pure utilities + client infra (api, crypto, zustand)
├── types/                # Shared TypeScript types
├── hooks/                # Shared React hooks
├── styles/               # Global CSS and design tokens
└── proxy.ts              # Public access (no login wall)
```

> **Note:** A legacy `component/` folder (singular) may still exist from an earlier scaffold. The active codebase uses `components/` (plural). Do not add new code to `component/`.

## Request flow

```
Browser request
  → proxy.ts               (app is public; leftover /login URLs redirect to /dashboard)
  → app/layout.tsx         (root HTML, Providers, global styles)
  → app/(dashboard)/layout.tsx   (AppShell: sidebar + header + main — no session check)
  → app/(dashboard)/<route>/page.tsx   (metadata + re-export feature page)
  → features/<name>/components/*-page.tsx   (actual page UI)
```

Public home is `app/page.tsx`. Scan intake is `/scan`. Dashboard, inventory, updates, and findings read the last report from `sessionStorage`. `/documentation` is public. Leftover `/login`, `/signup`, and `/onboarding` redirect away.

## Folder responsibilities

### `app/` — routing layer

Keep route files **thin**. They should define `metadata` and re-export the feature page component.

```tsx
// app/(dashboard)/dashboard/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Patch and dependency update intelligence — current vs latest, what changed, and whether to update.",
};

export { DashboardPage as default } from "@/features/dashboard";
```

| Path | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout, fonts, `Providers` |
| `app/(dashboard)/layout.tsx` | Wraps authenticated pages in `AppShell` |
| `app/(dashboard)/loading.tsx` | Route-level loading UI |
| `app/(dashboard)/error.tsx` | Route-level error boundary |
| `app/login/page.tsx` | Public login page |
| `app/signup/page.tsx` | Public signup page |
| `app/forgot-password/page.tsx` | Public password reset request |
| `app/reset-password/page.tsx` | Public set-new-password page |
| `app/onboarding/page.tsx` | Authenticated company setup |
| `app/documentation/` | Public documentation (own layout) |

### `features/` — feature modules

Each feature is a self-contained module. Use this structure:

```
features/<feature-name>/
├── index.ts              # Public barrel export (only export what other modules need)
├── components/           # Page components and feature-specific UI
├── data/                 # Static/mock data (optional)
├── stores/               # Feature-scoped Zustand stores (optional)
└── types/                # Feature-scoped types (optional)
```

**Current features:** `home`, `scan-session`, `dashboard`, `inventory`, `updates`, `scans`, `findings`, `settings`, `documentation`.

Settings is Preferences only (theme and layout). There is no account or company page in the product UI.

**Rules:**
- Feature pages import from `@/components/ui/*` and `@/components/shared/*`, not from other features directly.
- Server domain (GitHub, scanner, intelligence, session-scan) belongs in `services/`.
- Pure helpers and client infra belong in `lib/`, `hooks/`, or `components/`.
- Export the page component from `index.ts`; route files import from the barrel.

### `services/` — server-side domain

`app/api` stays HTTP-only. Orchestration and I/O live here — not in `lib/`.

| Path | Purpose |
|------|---------|
| `services/github/` | GitHub OAuth and REST. Tokens never leave the server. |
| `services/scanner/` | Manifest/lockfile parsers, repository walk |
| `services/intelligence/` | Latest versions, OSV/CVE, EOL, impact, P1–P4, recommendations |
| `services/session-scan/` | Stateless GitHub / SBOM / file scans (no database writes) |

Do not add a new `lib/<noun>/` folder for the next domain noun. GitHub, OSV, and scan engines go in `services/`.

### `components/` — shared UI

| Subfolder | Purpose |
|-----------|---------|
| `components/ui/` | shadcn/ui primitives (Button, Dialog, Sidebar, etc.) |
| `components/layout/` | App shell, header, sidebar, breadcrumbs, command menu, theme toggle |
| `components/shared/` | Reusable page-level pieces (`PageHeader`, chips, table helpers) |
| `components/feedback/` | Error boundaries, skeletons, error states |
| `components/providers.tsx` | Root client providers (theme, tooltip, toast) |

`AppShell` (`components/layout/app-shell.tsx`) is the dashboard chrome: sidebar, header, breadcrumbs sync, and content area. Header search / ⌘K command menu is commented out until we need it.

### `config/` — static configuration

| File | Purpose |
|------|---------|
| `config/navigation.ts` | Sidebar nav groups (`primaryNavigation`, `secondaryNavigation`) |
| `config/issue-palette.ts` | Colors and labels for issue type, severity, finding status, version drift, EOL, and scan state |

When adding a sidebar route, update `config/navigation.ts` so the sidebar and breadcrumbs stay in sync. Primary nav is Dashboard, Scan, Report (`/inventory`), and Settings (opens preferences). Package detail is `/inventory/:name`. `/updates` and `/findings` still exist but are not in the sidebar. Documentation is in `secondaryNavigation`; set `visible: false` on that item to hide it from the sidebar and the home header/footer. The `/documentation` route still works if you open the URL.

### `stores/` — global client state

Zustand stores for UI chrome (not feature business logic):

| Store | Purpose |
|-------|---------|
| `sidebar-store` | Sidebar open/collapsed state (persisted) |
| `layout-store` | Content width (`full` vs `contained`) (persisted) |
| `command-menu-store` | Command palette + recent pages (persisted) |

The scan report lives in `features/scan-session/stores/scan-session-store.ts` (`sessionStorage`, not localStorage).

Feature-specific state lives inside `features/<name>/stores/`. Brand colors are fixed in `styles/globals.css` (Geist ink/canvas). Light/dark uses `next-themes` only — there is no color picker.

#### Persisted stores (`lib/zustand/persist.ts`)

Several global stores use Zustand's `persist` middleware to save UI preferences in `localStorage` across reloads. When adding or changing a persisted store, follow this pattern:

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSIST_VERSION, persistMigrate } from "@/lib/zustand/persist";

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({ /* state + actions */ }),
    {
      name: "dashboard-example",           // unique localStorage key
      version: PERSIST_VERSION,
      migrate: persistMigrate<Pick<ExampleState, "fieldA" | "fieldB">>,
      partialize: (state) => ({            // only persist what should survive reload
        fieldA: state.fieldA,
        fieldB: state.fieldB,
      }),
    },
  ),
);
```

| Piece | Purpose |
|-------|---------|
| `persist` | Reads/writes store slice to `localStorage` on load and on change |
| `name` | Storage key — must be unique per store (e.g. `dashboard-sidebar`) |
| `partialize` | Omit transient state (open modals, loading flags) and action functions |
| `PERSIST_VERSION` | Shared schema version in `lib/zustand/persist.ts`; bump when saved shape changes |
| `persistMigrate` | Transforms older saved data into the current shape; required when `version` is set |

**When the persisted shape changes** (rename fields, change types, restructure objects):

1. Bump `PERSIST_VERSION` in `lib/zustand/persist.ts`.
2. Add migration logic in `persistMigrate` for each older version (today it pass-throughs unchanged data).
3. Use `partialize` so only serializable fields are saved — never persist functions.

**Current persisted stores:** `sidebar-store`, `layout-store`, `command-menu-store`, `company-context-store`.

### `lib/` and `hooks/`

Keep `lib/` free of GitHub/OSV/Slack I/O. Feature-local helpers stay under `features/<name>/lib/`.

- `lib/utils.ts` — `cn()` classname helper
- `lib/format-count.ts` — compact KPI numbers (`1.9K`, `1.2M`)
- `lib/breadcrumbs.ts` — derives breadcrumbs from pathname + navigation config
- `lib/fonts.ts` — font CSS variables
- `lib/scan-source.ts` — scan source display labels
- `lib/api/` — client fetch helpers + route `jsonError`
- `lib/auth/` — `session.ts` (`getSessionUserId`, `requireSession`), `proxy-access.ts` (bypass + public routes + safe path), `rate-limit.ts`, `cron.ts`, `client.ts`
- `lib/company/` — company name schema + slug
- `lib/crypto/secret.ts` — GitHub token encrypt/decrypt
- `lib/zustand/persist.ts` — shared `PERSIST_VERSION` and `persistMigrate` for persisted stores
- `hooks/use-mobile.ts` — responsive breakpoint hook

## Adding a new page

1. **Create the feature module**
   ```
   features/reports/
   ├── index.ts
   └── components/reports-page.tsx
   ```

2. **Add the route**
   ```
   app/(dashboard)/reports/page.tsx
   ```
   Export metadata and re-export `ReportsPage` from `@/features/reports`.

3. **Register navigation** in `config/navigation.ts`.

4. **Use shared page patterns**
   - `PageHeader` for title, description, and actions

## Conventions

| Topic | Convention |
|-------|------------|
| Imports | `@/*` path alias maps to project root |
| File names | kebab-case for files (`dashboard-page.tsx`, `app-shell.tsx`) |
| Components | PascalCase named exports (`DashboardPage`, `AppShell`) |
| Client components | `"use client"` only when needed (stores, hooks, interactivity) |
| Styling | Tailwind utility classes; global tokens in `styles/globals.css` |
| UI primitives | Add via shadcn CLI; live in `components/ui/` |

## Documentation sync (required with code changes)

When product behavior changes, update docs **in the same change**. Use the map: [`docs/DOC_MAP.md`](./docs/DOC_MAP.md).

| Layer | Update when… |
|-------|----------------|
| In-app `/documentation` markdown | User-facing flows, architecture, layout, APIs in this app |
| `docs/HANDOFF.md` + `README.md` | Clone setup, company/auth, project layout |
| `features/documentation/data/docs-nav.ts` | New or renamed doc pages |
| This file (`AGENTS.md`) | Conventions agents must follow |

Do not leave documentation for a follow-up PR if the code already changed the flow (home, scan, GitHub, dashboard).

## Auth

- There is **no login wall**. `proxy.ts` allows dashboard and scan routes without a session. Leftover `/login`, `/signup`, and `/onboarding` redirect to `/dashboard`.
- GitHub OAuth is repository access, not product login: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN_ENCRYPTION_KEY`. Scope is `read:user repo`. Scans never write. Optional `GITHUB_TOKEN` skips OAuth on a self-hosted server.
- Session GitHub token: encrypted httpOnly cookie `ss_github` (~1 hour). Never returned to the browser. Never written to Postgres.
- Scans: `POST /api/session/scan` with `source: github | sbom | files`. GitHub accepts `repositories: [{ fullName, branch? }]` (up to 8) and optional `scanMode: selected` with `files` paths. Enriches up to 400 unique packages (OSV / latest / GitHub release notes / EOL; infra and direct first). The JSON report is returned once; the UI keeps it in `sessionStorage`. Report (`/inventory`) default is infra pins + declared dependencies + security transitives. Open a package at `/inventory/:name`. File search is `GET /api/session/github/files`.
- Required env for GitHub OAuth: `APP_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN_ENCRYPTION_KEY`. File/SBOM scans work without GitHub.

## Quality checks (before push)

Run the full CI suite locally:

```bash
pnpm check
```

This runs, in order: **ESLint** → **TypeScript** → **unit tests** → **nav route validation** → **production build**.

| Script | What it checks |
|--------|----------------|
| `pnpm lint` | ESLint (`eslint . --max-warnings 0`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test:run` | Vitest unit tests |
| `pnpm validate:nav` | Every `href` in `config/navigation.ts` has a matching `app/(dashboard)/.../page.tsx` |
| `pnpm check` | All of the above + production build |
| `pnpm test:e2e` | Playwright smoke (home, scan, public dashboard, session scan API) |

**Before pushing:** a Husky **pre-push** hook runs `pnpm check`. After `pnpm install`, hooks are enabled via the `prepare` script. To bypass once: `git push --no-verify`.

**On GitHub:** `.github/workflows/ci.yml` runs `pnpm check`, Playwright e2e, and `pnpm audit --prod` on push to `main`/`master` and on pull requests.

When adding a sidebar route, run `pnpm validate:nav` (or `pnpm check`) so CI does not fail on a missing page file.

## Key dependencies

- **UI:** Base UI primitives (via shadcn/ui), lucide-react icons, cmdk (command menu)
- **Theming:** next-themes (class-based light/dark). Colors are locked in `styles/globals.css`.
- **Toasts:** sonner
- **State:** zustand (`persist` for sidebar, layout, command menu; sessionStorage for the scan report)
- **Auth / DB:** Not required for session scans. Leftover Supabase helpers remain in the repo.
