---
title: Self-host
description: Run SecureStack yourself. No user database. GitHub tokens stay in a session cookie or an env var. Scan results stay in the browser.
lastUpdated: 2026-09-01
related:
  - href: /documentation/connect
    title: Connect GitHub
    description: OAuth, PAT, and the server token visitors will use.
  - href: /documentation/scan
    title: Run a scan
    description: GitHub, SBOM, and file scans on your instance.
---

Clone the repo and run it. SecureStack does **not** create companies, users, or projects. There is no database on the scan → dashboard path.

## Quick start

```bash
pnpm install
cp .env.example .env.local
```

1. Set `APP_URL` (for local: `http://localhost:3000`).
2. Create a GitHub OAuth App with callback `http://localhost:3000/api/github/callback`, **or** set `GITHUB_TOKEN`.
3. If you use OAuth or a pasted PAT, set `GITHUB_TOKEN_ENCRYPTION_KEY` (16+ characters).
4. `pnpm dev` and open `/scan`.

File and SBOM scans work with no GitHub configuration.

pnpm 11 blocks dependency build scripts until they are listed in `pnpm-workspace.yaml` under `allowBuilds`. This repo already allows `esbuild`, `sharp`, and `unrs-resolver`.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_URL` | For OAuth | Public origin of this instance |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | For OAuth | GitHub OAuth App |
| `GITHUB_REDIRECT_URI` | Optional | Defaults to `{APP_URL}/api/github/callback` |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | OAuth or pasted PAT | Encrypts cookie `ss_github` (min 16 characters) |
| `GITHUB_TOKEN` | Optional | Server-side token; visitors skip OAuth |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Shared scan rate limit across instances |
| `ENFORCE_PRODUCTION_ENV` | Optional | Fail fast in production if Upstash is missing |

Without Upstash, production uses an in-memory limiter (one process). `/api/health` is public.

## Docker

The image is Next.js `standalone`. Health check hits `/api/health`. Pass the same env vars you would use with `pnpm start`.

## What is stored where

| Data | Where | Lifetime |
| --- | --- | --- |
| GitHub access token | Cookie `ss_github` (encrypted, httpOnly) or `GITHUB_TOKEN` | About one hour, or process lifetime for env |
| Scan report | Browser `sessionStorage` | Until the tab closes or **Clear scan** |
| OSV / registry / EOL answers | Fetched during the scan | Not persisted as user data |

API JSON never includes the GitHub token.

## Session APIs

| Route | Purpose |
| --- | --- |
| `GET /api/session/github` | Connected? login + repository list |
| `GET /api/session/github?connect=1` | Start OAuth (`returnTo=/scan`) |
| `POST /api/session/github` | `{ token }` — PAT into the session cookie |
| `DELETE /api/session/github` | Drop the cookie |
| `GET /api/session/github/files` | Search blob paths (`fullName`, `branch`, `q`) |
| `POST /api/session/scan` | `{ source: "github" \| "sbom" \| "files" }` → enriched report |
| `GET /api/github/callback` | OAuth callback |
| `GET /api/health` | Liveness |

GitHub scan body: `{ source: "github", repositories: [{ fullName, branch? }], scanMode?, files? }`. `scanMode: "selected"` scans only `files`. Scans are rate-limited per IP. Caps: 8 repositories, 80 manifests, 400 unique packages, 40 release-note lookups. Request timeout is 120 seconds.

## Not in this product

No user accounts, stored scan history, cron re-scans, or Slack/email digests. Run a new scan when you need a fresh report.
