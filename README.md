# SecureStack

**Patch and dependency update intelligence**. Connect GitHub or upload a file. SecureStack discovers the open-source versions in use, detects new releases, explains what changed, and recommends whether to update.

**No signup. No user database.** The report stays in this browser tab. GitHub tokens are not written to Postgres.

## Stack

- **Next.js 16** (App Router)
- **React 19**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**
- **Zustand** (UI chrome + session scan), **TanStack Query**

## Getting started

```bash
pnpm install
cp .env.example .env.local
```

Set `APP_URL`. For GitHub, create an OAuth App (callback `http://localhost:3000/api/github/callback`) **or** set `GITHUB_TOKEN`. If you use OAuth or a pasted PAT, also set `GITHUB_TOKEN_ENCRYPTION_KEY` (min 16 characters).

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). **Scan a repository** goes to `/scan`. There is no account.

## What you get

| Area | Status |
|------|--------|
| App shell | Sidebar, header, breadcrumbs |
| Pages | Public home, Scan, Dashboard, Report, Settings, public `/documentation` |
| Auth | None required. Leftover `/login` URLs redirect away |
| GitHub | OAuth or PAT in a short-lived httpOnly cookie (not a database) |
| Scanning | GitHub, CycloneDX/SPDX, or uploaded manifests — parsed in the request |
| CVE / EOL | OSV + registries + GitHub Releases + endoflife.date |
| Storage | Scan JSON in `sessionStorage`. Close the tab to discard it |

## Developer handoff

Start here: **[docs/HANDOFF.md](./docs/HANDOFF.md)**

Also see [CONTRIBUTING.md](./CONTRIBUTING.md), the public **Documentation** site (`/documentation`), and [`docs/DOC_MAP.md`](./docs/DOC_MAP.md) for keeping docs in sync with code.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint (fails on warnings) |
| `pnpm typecheck` | TypeScript check |
| `pnpm test:run` | Run unit tests |
| `pnpm test:coverage` | Unit tests with coverage report |
| `pnpm test:e2e` | Playwright smoke test |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check Prettier formatting |
| `pnpm validate:nav` | Ensure nav `href`s have matching routes |
| `pnpm check` | Run all CI checks locally (lint → typecheck → test → nav → build) |

## Project structure

```
app/             Thin routes (metadata + re-exports) and /api handlers
features/        Feature modules (page UI, hooks, session scan store)
components/
  ui/            Design-system primitives (Button, Dialog, Table, …)
  layout/        App shell: sidebar, header, command menu
  shared/        PageHeader, chips, table helpers
  feedback/      Empty, error, skeleton states
config/          app.ts, navigation.ts
lib/             API client, utilities (no GitHub/OSV I/O)
stores/          Global UI state (sidebar, layout, command menu)
services/        Domain engines: github/, scanner/, intelligence/, session-scan/
scripts/         Nav validation and other repo tools
docs/            Developer handoff
proxy.ts         Public access (no login wall)
```

See [AGENTS.md](./AGENTS.md) for conventions and how to add pages.

## Example patterns included

| Pattern | Where to look |
|---------|----------------|
| TanStack Query + API route | `features/scan-session/hooks/use-scan-session.ts` |
| Session report store | `features/scan-session/stores/scan-session-store.ts` |
| Settings | `features/settings/components/preferences-settings-page.tsx` |
| Live UI catalog | `/documentation/ui` |
| API client | `lib/api/client.ts` |

## Auth

- Supabase Auth (email + password). `proxy.ts` verifies session cookies with `getClaims()` only when a protected route needs them; public pages and anonymous requests do not wait on Auth. Login/signup wait for Auth to finish (do not abort those fetches).
- Signup: `POST /api/auth/signup` with name, email, and password (min 8 characters)
- Login: `POST /api/auth/login` — sets the session cookie
- Forgot password: `/forgot-password` → `POST /api/auth/forgot-password` → email link → `/auth/callback` → `/reset-password`
- Account: `/settings/account` for name, email, and update password
- Logout: `POST /api/auth/logout` — clears the session cookie and sends you to `/login`
- Session user: `GET /api/auth/me` — hydrates the client user store (`401` when signed out)
- `proxy.ts` redirects unauthenticated users to `/login`
- Set `AUTH_DEV_BYPASS=true` in `.env.local` to skip the login wall during UI work only. Leave it `false` to test login/logout.
- Upstash Redis is **recommended** for shared login rate limiting; without it, production uses an in-memory limiter (single instance only)
- Set `ENFORCE_PRODUCTION_ENV=true` to fail fast when secrets or Upstash are missing
- `/api/*` is public at the proxy layer by default — protect real APIs in the route handlers

## License and security

- License: [MIT](./LICENSE)
- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Adding a page

1. Create `features/<name>/components/<name>-page.tsx`
2. Export from `features/<name>/index.ts`
3. Add thin route at `app/(dashboard)/<name>/page.tsx`
4. Register in `config/navigation.ts`
5. Run `pnpm validate:nav`

## CI

GitHub Actions runs:

- `pnpm check` (lint, typecheck, unit tests, nav validation, build)
- `pnpm test:e2e` (Playwright: public home, signup, login, forgot/reset, dashboard redirect, auth APIs)
- `pnpm audit --prod` (dependency vulnerability scan)

A **pre-push** git hook runs `pnpm check` automatically — install deps with `pnpm install` so Husky is set up via the `prepare` script.

Skip the hook once if needed: `git push --no-verify`.

## Deployment baseline

- Dockerfile included (multi-stage, production standalone output, non-root runtime user, health check).
- Health endpoint: `GET /api/health`
- Terraform baseline included in `infra/terraform/` (not required for local dev).
