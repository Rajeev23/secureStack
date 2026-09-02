# SecureStack

**Patch and dependency update intelligence**. Connect GitHub or upload a file. SecureStack discovers the open-source versions in use, detects new releases, explains what changed, and recommends whether to update.

**No signup. No user database.** The report stays in this browser tab. GitHub tokens are not written to a database.

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

Source: [github.com/Rajeev23/secureStack](https://github.com/Rajeev23/secureStack)

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

Also see the public **product documentation** at `/documentation` (connect, scan, report, findings). Contributor layout lives in [AGENTS.md](./AGENTS.md). Keep docs in sync with [`docs/DOC_MAP.md`](./docs/DOC_MAP.md).

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
| Documentation | `/documentation` (markdown in `features/documentation/content/`) |
| API client | `lib/api/client.ts` |

## GitHub access

- There is no product login. `proxy.ts` allows the app. Leftover `/login`, `/signup`, and `/onboarding` URLs redirect to `/dashboard`.
- GitHub OAuth is repository access: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN_ENCRYPTION_KEY`. Scope is `read:user repo`. Scans never write. Visitors never set env — they click **Connect GitHub**. Optional `GITHUB_TOKEN` skips OAuth on a private self-hosted server; it is instance-wide and must not be set on a public host.
- The GitHub token is an encrypted httpOnly cookie (`ss_github`, ~1 hour). It is never returned to the browser.
- Scans: `POST /api/session/scan` (JSON body capped at 22 MB). IP rate limits cover scans, GitHub connect, and repo/file listing. Upstash Redis is optional for shared limiting; without it, production uses an in-memory limiter (single instance).
- `/api/health` is public.

## License and security

- License: [MIT](./LICENSE)
- Security policy: [SECURITY.md](./SECURITY.md)

## Adding a page

1. Create `features/<name>/components/<name>-page.tsx`
2. Export from `features/<name>/index.ts`
3. Add thin route at `app/(dashboard)/<name>/page.tsx`
4. Register in `config/navigation.ts`
5. Run `pnpm validate:nav`

## CI

GitHub Actions runs:

- `pnpm check` (lint, typecheck, unit tests, nav validation, build)
- `pnpm test:e2e` (Playwright: public home, scan, dashboard, session scan API)
- `pnpm audit --prod` (dependency vulnerability scan)

A **pre-push** git hook runs `pnpm check` automatically — install deps with `pnpm install` so Husky is set up via the `prepare` script.

Skip the hook once if needed: `git push --no-verify`.

## Deployment baseline

- **Vercel:** set `APP_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_TOKEN_ENCRYPTION_KEY` in Project → Environment Variables. Do not set `GITHUB_REDIRECT_URI` or `GITHUB_TOKEN`. Add the production callback `https://YOUR_DOMAIN/api/github/callback` on the GitHub OAuth App. Visitors click **Connect GitHub** — they do not install anything. Details: `/documentation/self-host`.
- Dockerfile included (multi-stage, production standalone output, non-root runtime user, health check).
- Health endpoint: `GET /api/health`
