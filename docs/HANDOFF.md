# Developer Handoff

**SecureStack** is patch and dependency update intelligence for companies. Phase 2 of the product TRD is live on the five-table model: **discover / compare / recommend**, **scheduled monitoring**, **impact + P1–P4**, **Slack/email alerts**, **SBOM upload**, and **trends**. The five tables are unchanged; extra fields live in `companies.monitoring`, `projects.monitoring`, and `scans.result_snapshot`.

## What is ready vs placeholder

| Ready to use | Later |
|--------------|-------------|
| App shell (sidebar, header, command menu) | GitLab/Bitbucket, BullMQ queue, Create PR / policy engine |
| Supabase Auth (email + password) | |
| Company onboarding + Settings → Company (interval, Slack webhook, email, digest) | |
| Projects (create, list, detail, remove, environment) | |
| GitHub OAuth + repository selection | Tokens never sent to the browser |
| Repository scan + CycloneDX/SPDX SBOM upload | Stored on `scans.result_snapshot` |
| Latest version, GitHub release notes, OSV/CVE, EOL, findings | External APIs; 400 unique packages (infra/direct first), 80 manifests, 40 release-note lookups per scan |
| Dashboard counts, trends, P1 mix, What’s changed alerts | Actionable updates only (infra + direct + security transitives). P1–P4 + Update urgently / Update / Review / Wait |
| Scheduled scans + finding auto-close | What’s changed is upstream current → latest. Scan-to-scan diff is on Scans → Since last scan |
| Inventory default view | Infra pins (`bom.yaml` / `versions.yaml`) and declared dependencies. Hides routine lockfile / node_modules helpers; Show toggle lists them. Updates groups those bumps by parent |

## Quick start

```bash
pnpm install
cp .env.example .env.local
```

Then follow **[docs/supabase/README.md](./supabase/README.md)** in order:

1. Create a Supabase project
2. Copy URL + publishable key + service role key
3. Disable email confirmation for local signup
4. Run `01-schema.sql` then `02-rls.sql` in the SQL Editor
5. If those files were already applied before Phase 4, also run `04-phase4.sql`
6. Create a GitHub OAuth App (callback `http://localhost:3000/api/github/callback`)
7. Fill GitHub + encryption env vars. For production cron, set `CRON_SECRET` (16+ characters).
8. `pnpm dev`

New accounts: public home `/` (or `/signup`) with name, email, and password → `/onboarding` (company name) → `/dashboard`. Header **Sign in** goes to `/login`. Use **Forgot password** if you cannot sign in.

To wipe tables while iterating, run `docs/supabase/03-reset.sql`.

Run all checks before pushing:

```bash
pnpm check
```

## Data model

Five application tables in Supabase PostgreSQL:

```text
companies → users
companies → projects → scans
                 └── findings
```

`users.id` matches `auth.users.id`. GitHub tokens are encrypted on `companies.github_connection` (hidden from the authenticated role).

## Project layout

```
app/              Thin routes (metadata + re-export feature pages)
  documentation/  Public docs site (no dashboard shell)
  onboarding/     Authenticated company setup
features/         Feature modules — page UI, hooks, feature UI
services/api/     Company-scoped DB orchestration (auth, company, projects, scans)
services/github/  GitHub OAuth + REST
services/scanner/ Manifest parse, repository walk
services/intelligence/  OSV, EOL, versions, P1–P4
services/monitoring/   Schedule, Slack/email
server/supabase/  Auth/admin clients
components/       Shared shell + design system
config/           app.ts, navigation.ts, project-nav.ts
lib/              Utilities, API client, auth helpers (no GitHub/OSV/Slack I/O)
stores/           Global UI state (+ company-context-store)
docs/supabase/    SQL you paste into the Supabase SQL Editor
```

## Feature module template

```
features/<name>/
  index.ts                 # Public exports only
  components/
    <name>-page.tsx        # Page component
  data/                    # Optional mock/static data
  hooks/                   # Optional TanStack Query hooks
  types/                   # Optional feature types
```

**Reference implementations:**

- `features/onboarding/` — company name after signup
- `features/projects/` — create project, GitHub OAuth, one repository per project, Start Scan, inventory / updates / findings / scans on the project. Sidebar Projects appears after the first project. Two or more projects nest under sidebar Projects.
- `features/scans/` — scan APIs/hooks
- `features/inventory/` — component list used on the project
- `features/updates/` — outdated packages vs latest release
- `features/findings/` — security / update / EOL findings
- `features/dashboard/` — greeting uses first name; empty company shows Add Project empty state. With projects, KPIs are project count plus open findings. Lists Recent findings, Updates, and Recent scans. Issue/severity/status chips use `config/issue-palette.ts`.
- `features/settings/` — account, company, preferences

## Adding a page

1. Create `features/<name>/components/<name>-page.tsx`
2. Export from `features/<name>/index.ts`
3. Add `app/(dashboard)/<name>/page.tsx` with `metadata` + default export
4. Register `href` in `config/navigation.ts` (unless intentionally settings-only)
5. Run `pnpm validate:nav`

## Patterns to copy

### Data fetching (TanStack Query)

- Hook: `features/dashboard/hooks/use-dashboard-stats.ts`
- API route: `app/api/dashboard/stats/route.ts`
- Client: `lib/api/client.ts` (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `ApiError`)

### Company APIs

- Context: `GET /api/company/context`
- Onboarding: `GET/POST /api/onboarding`
- Company: `GET/PATCH /api/company`
- Projects: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`. A project with no repository reopens `/projects/:id/connect`.
- GitHub: `GET /api/github/connect`, `GET /api/github/callback`, `GET /api/github/repositories`
- Scans: `POST/GET /api/projects/:id/scans`, `POST /api/projects/:id/sbom`, `GET /api/scans`, `GET /api/scans/:id`, `GET /api/projects/:id/components`
- Scheduled scans: `POST /api/scans/scheduled` (this company), `GET/POST /api/cron/scans` (`CRON_SECRET`)
- Inventory: `GET /api/inventory` (`offset` / `limit`, `outdated=1`, `transitive=1`)
- Project components: `GET /api/projects/:id/components` (paginated default view; `transitive=1` includes lockfile noise; coverage, available updates, scan-to-scan diff)
- Findings: `GET /api/findings`, `GET /api/projects/:id/findings`, `PATCH /api/findings/:id`

### Settings forms

- Settings forms: `features/settings/components/account-settings-page.tsx`, `company-settings-page.tsx`

## Auth

| File | Purpose |
|------|---------|
| `server/supabase/*` | Cookie session + service-role client |
| `proxy.ts` | Edge gate: skip Auth on public/anonymous requests; `getClaims()` on protected session cookies |
| `app/api/auth/*` | Login / signup / logout / me / forgot-password / reset-password |
| `app/api/account` | Signed-in name + password update |
| `services/api/auth.ts` | Profile lookup + post-auth redirect |
| `features/auth/stores/user-store.ts` | Client user state (hydrated via `/api/auth/me`) |

- Signup, login, and forgot-password are IP rate-limited; signup and reset emails avoid email enumeration.
- Login and signup must not abort Auth fetches. Public pages stay fast by skipping Auth lookup, not by timing out `signInWithPassword`.
- Signup collects name, email, and password (at least 8 characters).
- Set `AUTH_DEV_BYPASS=true` in `.env.local` to skip auth redirects during local development.

## After handoff

1. The TRD MVP (phases 1–4) is in this repository
2. Keep docs in sync using `docs/DOC_MAP.md`
3. Keep extra Phase 2+ fields in JSON (`companies.monitoring`, `projects.monitoring`, `scans.result_snapshot`) — do not add a sixth table unless volume requires it
