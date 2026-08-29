<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Architecture

**SecureStack** — enterprise patch and dependency update intelligence, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, and **Zustand**.

Customers are **companies**. Do not use tenant in the product UI. Database keys use `company_id`.

## High-level layout

```
securestack/
├── app/                  # Routes only — thin page files, layouts, loading/error
├── features/             # Feature modules — page UI, feature data, feature stores
├── services/
│   ├── api/              # Company-scoped DB orchestration
│   ├── github/           # GitHub OAuth + REST
│   ├── scanner/          # Manifest parse, repository walk
│   ├── intelligence/     # OSV, EOL, versions, P1–P4, recommendations
│   └── monitoring/      # Scan interval, digest, Slack/email
├── server/supabase/      # Supabase Auth + admin/server clients
├── components/           # Shared UI: layout shell, feedback, design-system primitives
├── config/               # Static app config (navigation, project-nav, app)
├── stores/               # Global client state (sidebar, layout, command menu, company context)
├── lib/                  # Pure utilities + client infra (auth, api, crypto, zustand)
├── types/                # Shared TypeScript types
├── hooks/                # Shared React hooks
├── styles/               # Global CSS and design tokens
└── proxy.ts              # Auth gate (Supabase session cookie check)
```

> **Note:** A legacy `component/` folder (singular) may still exist from an earlier scaffold. The active codebase uses `components/` (plural). Do not add new code to `component/`.

## Request flow

```
Browser request
  → proxy.ts               (public pages pass through; session cookies verified on app routes)
  → app/layout.tsx         (root HTML, Providers, global styles)
  → app/(dashboard)/layout.tsx   (AppShell: sidebar + header + main)
  → app/(dashboard)/<route>/page.tsx   (metadata + re-export feature page)
  → features/<name>/components/*-page.tsx   (actual page UI)
```

Public routes live outside the dashboard group (`app/page.tsx` home, `app/login/page.tsx`, `app/signup/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `app/documentation/`). Authenticated onboarding lives at `app/onboarding/` for accounts without a company. Signup creates a Supabase Auth user and sends them to `/onboarding`. Incomplete onboarding is redirected from `app/(dashboard)/layout.tsx` to `/onboarding`.

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

**Current features:** `home`, `auth`, `onboarding`, `dashboard`, `projects`, `inventory`, `updates`, `scans`, `findings`, `settings`, `documentation`.

Company and user account settings live under `features/settings/`. UI copy says **Company**, never Tenant.

**Rules:**
- Feature pages import from `@/components/ui/*` and `@/components/shared/*`, not from other features directly.
- Server domain (GitHub, scanner, intelligence, monitoring) belongs in `services/`.
- Pure helpers and client infra belong in `lib/`, `hooks/`, or `components/`.
- Export the page component from `index.ts`; route files import from the barrel.

### `services/` — server-side domain

`app/api` stays HTTP-only. Orchestration and I/O live here — not in `lib/`.

| Path | Purpose |
|------|---------|
| `services/api/` | Company-scoped DB workflows (auth, company, projects, GitHub connection, scans, findings) |
| `services/github/` | GitHub OAuth and REST. Tokens never leave the server. |
| `services/scanner/` | Manifest/lockfile parsers, repository walk, scan list snapshot shape |
| `services/intelligence/` | Latest versions, OSV/CVE, EOL, impact, P1–P4, recommendations |
| `services/monitoring/` | Scan interval, digest due, Slack/email dispatch |

Do not add a new `lib/<noun>/` folder for the next domain noun. GitHub, OSV, Slack, and scan engines go in `services/`.

### `components/` — shared UI

| Subfolder | Purpose |
|-----------|---------|
| `components/ui/` | shadcn/ui primitives (Button, Dialog, Sidebar, etc.) |
| `components/layout/` | App shell, header, sidebar, breadcrumbs, command menu, theme toggle |
| `components/shared/` | Reusable page-level pieces (`PageHeader`, chips, table helpers) |
| `components/feedback/` | Error boundaries, skeletons, error states |
| `components/providers.tsx` | Root client providers (theme, tooltip, toast) |

`AppShell` (`components/layout/app-shell.tsx`) is the dashboard chrome: sidebar, header, command menu, breadcrumbs sync, and content area.

### `config/` — static configuration

| File | Purpose |
|------|---------|
| `config/navigation.ts` | Sidebar nav groups (`primaryNavigation`, `secondaryNavigation`) |
| `config/project-nav.ts` | Nested project names under sidebar Projects (cap eight) |
| `config/issue-palette.ts` | Colors and labels for issue type, severity, finding status, version drift, EOL, and scan state |

When adding a sidebar route, update `config/navigation.ts` so the sidebar and breadcrumbs stay in sync. Company settings live under Settings. Primary nav is Dashboard, Projects, and Settings. Projects is hidden until the company has at least one project. With two or more projects, project names nest under Projects (cap eight). A project opens at `/projects/:id/overview`. Inventory and scans are sibling routes. Package updates, what changed, and findings live on `/projects/:id/inventory/:name`. Breadcrumbs show the project name, not the UUID.

### `stores/` — global client state

Zustand stores for UI chrome (not feature business logic):

| Store | Purpose |
|-------|---------|
| `sidebar-store` | Sidebar open/collapsed state (persisted) |
| `layout-store` | Content width (`full` vs `contained`) (persisted) |
| `command-menu-store` | Command palette + recent pages (persisted) |
| `company-context-store` | Active company for the sidebar label |

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

Do not leave documentation for a follow-up PR if the code already changed the flow (onboarding, company, GitHub, settings, auth).

## Auth

- `proxy.ts` is the auth gate. Public routes (`/`, `/login`, `/signup`, `/documentation`, `/api`, static files) do not wait on Auth. Anonymous requests with no `sb-*-auth-token` cookie are redirected to `/login` immediately. When a session cookie is present on a protected route, the proxy verifies it with `getClaims()` (signed JWT, never `getSession()`, never a fake user id). If verification fails, access is denied. API handlers still call `requireSession` / `getSessionUserId`. Do not wrap login/signup/session Supabase clients in fetch abort timeouts — that turned working Auth (often 5–8s) into 401/503. Hang prevention is skip-lookup on public/anonymous traffic, not aborting Auth.
- Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/documentation`. Signup/login/forgot-password are rate-limited; signup and forgot-password avoid email enumeration.
- Signup: `POST /api/auth/signup` with name, email, and password (min length 8) → `/onboarding`. Invalid email returns a field error.
- Forgot password: `POST /api/auth/forgot-password` emails a reset link; `/auth/callback` exchanges the code; `POST /api/auth/reset-password` sets the new password.
- Account: Settings → Account (`/settings/account`) shows name, email, and update password (`GET/PATCH /api/account`, `POST /api/account/password`).
- Onboarding: `POST /api/onboarding` with company name creates the company and application `users` row (role `ADMIN`).
- Logout: `POST /api/auth/logout` or `signOut()` from `lib/auth/client.ts` — revokes the Auth session, expires `sb-*-auth-token` cookies, and sends the browser to `/login`. After logout, `/api/auth/me` is `401` and `/dashboard` redirects to login.
- Set `AUTH_DEV_BYPASS=true` in `.env.local` to skip the login wall during UI work. It is ignored in production. Leave it `false` to test login/logout — with bypass on, `/dashboard` stays reachable without a session.
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`. See `docs/supabase/README.md`.
- GitHub OAuth (repository access, not login): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN_ENCRYPTION_KEY`. Scope is `read:user repo` so private repos can be listed and read; scans never write.
- Projects: one GitHub repository per project. Creating a project goes to Connect GitHub; Back, refresh, or opening the project again resumes that step until a repo is linked **and** scan scope is saved (`scanMode` `full` or `selected` files on `projects.monitoring`). `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `GET /api/github/repository-files`. Removing a project also deletes its scans and findings.
- Scans: `POST /api/projects/:id/scans` reads GitHub on the server (entire repo or the project’s saved file list), enriches up to 400 unique packages (OSV / latest / GitHub release notes / EOL; infra and direct first), and stores inventory on `scans.result_snapshot`. Findings are derived from that snapshot (not inserted into `findings`). `POST /api/projects/:id/sbom` imports CycloneDX or SPDX JSON the same way (`source: sbom`). Inventory is discovery (default: infra pins from `bom.yaml` / `versions.yaml` + declared dependencies + security transitives). Open a package at `/projects/:id/inventory/:name` for current → new, what changed, and findings. Company-wide `/inventory`, `/updates`, `/findings`, and `/scans` URLs still exist but are not in the sidebar. Scan list APIs omit the component tree; inventory is paginated (`transitive=1` includes lockfile noise). `GET /api/projects/:id/components?name=` looks up one package including transitives.
- Scheduled scans: `GET/POST /api/cron/scans` (Vercel Cron + `CRON_SECRET`) or `POST /api/scans/scheduled` for the signed-in company. Interval, Slack webhook, notify email, and digest live on `companies.monitoring` (webhook URL is never returned to the client). Per-project on/off, environment, and scan scope live on `projects.monitoring`. Existing databases need `docs/supabase/04-phase4.sql`. Optional `RESEND_API_KEY` + `NOTIFY_FROM_EMAIL` for email alerts.

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
| `pnpm test:e2e` | Playwright auth shell (home, signup, login, forgot/reset, dashboard redirect, API contracts) |

**Before pushing:** a Husky **pre-push** hook runs `pnpm check`. After `pnpm install`, hooks are enabled via the `prepare` script. To bypass once: `git push --no-verify`.

**On GitHub:** `.github/workflows/ci.yml` runs `pnpm check`, Playwright e2e, and `pnpm audit --prod` on push to `main`/`master` and on pull requests.

When adding a sidebar route, run `pnpm validate:nav` (or `pnpm check`) so CI does not fail on a missing page file.

## Key dependencies

- **UI:** Base UI primitives (via shadcn/ui), lucide-react icons, cmdk (command menu)
- **Theming:** next-themes (class-based light/dark). Colors are locked in `styles/globals.css`.
- **Toasts:** sonner
- **State:** zustand (+ `persist` middleware for sidebar, layout, command menu)
- **Auth / DB:** Supabase Auth + PostgreSQL (RLS). SQL for tables lives in `docs/supabase/`.
