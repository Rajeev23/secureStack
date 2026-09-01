# Developer Handoff

**SecureStack** is patch and dependency update intelligence you can self-host. Connect GitHub or upload a file. The product **discovers / compares / recommends** (current vs latest, what changed, P1–P4). **No accounts. No user database.** The report lives in this browser tab.

## What is ready vs placeholder

| Ready to use | Later |
|--------------|-------------|
| App shell (sidebar, header) | GitLab/Bitbucket, Create PR / policy engine |
| Public home + `/scan` with no signup | Optional persistence for scheduled monitoring |
| GitHub OAuth or PAT in a session cookie | |
| Repository scan + CycloneDX/SPDX + uploaded manifests | |
| Latest version, GitHub release notes, OSV/CVE, EOL, findings | External APIs; 400 unique packages (infra/direct first), 80 manifests, 40 release-note lookups per scan |
| Dashboard, inventory, updates, findings from the in-tab report | Report is the inventory list in the sidebar; updates/findings routes remain |

## Quick start

```bash
pnpm install
cp .env.example .env.local
```

1. Set `APP_URL=http://localhost:3000`
2. Create a GitHub OAuth App (callback `http://localhost:3000/api/github/callback`) **or** set `GITHUB_TOKEN`
3. If you use OAuth or a pasted PAT, set `GITHUB_TOKEN_ENCRYPTION_KEY` (16+ characters)
4. `pnpm dev`

Open `/`, then **Scan a repository**.

Run all checks before pushing:

```bash
pnpm check
```

## Data model (this mode)

Nothing is written to a database for a session scan.

```text
GitHub cookie (optional, ~1 hour) + sessionStorage report
```

## Project layout

```
app/              Thin routes (metadata + re-export feature pages)
  documentation/  Public docs site (no dashboard shell)
features/         Feature modules — page UI, hooks, session scan store
services/github/  GitHub OAuth and REST. Tokens never sent to the browser
services/scanner/ Manifest parse, repository walk
services/intelligence/  OSV, EOL, versions, P1–P4
services/session-scan/  Stateless GitHub / SBOM / file scans
components/       Shared shell + design system
config/           app.ts, navigation.ts
lib/              Utilities, API client
stores/           Global UI chrome
```

## Feature module template

```
features/<name>/
  index.ts                 # Public exports only
  components/
    <name>-page.tsx        # Page component
```

**Reference implementations:**

- `features/scan-session/` — `/scan`, GitHub session, `POST /api/session/scan`, sessionStorage store
- `features/dashboard/` — empty until a scan; KPIs from the in-tab report
- `features/inventory/` — Report (`/inventory`); package detail `/inventory/:name`
- `features/updates/` — outdated packages (not in the sidebar)
- `features/findings/` — security / update / EOL findings (not in the sidebar)
- `features/settings/` — preferences (`/settings/preferences`)

## Adding a page

1. Create `features/<name>/components/<name>-page.tsx`
2. Export from `features/<name>/index.ts`
3. Add `app/(dashboard)/<name>/page.tsx` with `metadata` + default export
4. Register `href` in `config/navigation.ts`
5. Run `pnpm validate:nav`

## Session APIs

- GitHub: `GET/POST/DELETE /api/session/github`, `GET /api/session/github/files`, `GET /api/github/callback`
- Scan: `POST /api/session/scan` (`source: github | sbom | files`; GitHub `repositories` + optional selected `files`)

## Auth

There is no login wall. `proxy.ts` allows app routes. `/login`, `/signup`, and `/onboarding` redirect to the dashboard.

## After handoff

1. Keep **product** docs in sync using `docs/DOC_MAP.md` (`/documentation`)
2. Keep contributor conventions in `AGENTS.md` — not in the public docs site
3. Do not add a user table unless persistence becomes an explicit product choice
