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

To scan **your** GitHub repos locally without putting OAuth keys in `.env.local`, paste a personal access token on `/scan`. **Connect GitHub** (the button visitors use on Vercel) cannot work from a URL with no OAuth App — GitHub rejects it.

pnpm 11 blocks dependency build scripts until they are listed in `pnpm-workspace.yaml` under `allowBuilds`. This repo already allows `esbuild`, `sharp`, and `unrs-resolver`.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_URL` | For OAuth | Public origin of this instance |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | For OAuth | GitHub OAuth App |
| `GITHUB_REDIRECT_URI` | Optional | Defaults to `{APP_URL}/api/github/callback` |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | OAuth or pasted PAT | Encrypts cookie `ss_github` (min 16 characters) |
| `GITHUB_TOKEN` | Optional | Server-side token; visitors skip OAuth. **Instance-wide** — every visitor can scan whatever this token can read. Do not set on a public host. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Shared IP rate limit across instances (scans, GitHub connect, repo list) |
| `ENFORCE_PRODUCTION_ENV` | Optional | Fail fast in production if Upstash is missing |

Without Upstash, production uses an in-memory limiter (one process). `/api/health` is public.

**`GITHUB_TOKEN` is not a user session.** If this instance is reachable by more than your team, omit `GITHUB_TOKEN` and use OAuth so each visitor’s access stays in their cookie.

## Vercel (any visitor connects their GitHub)

Visitors do **not** clone the repo, install Node, or edit `.env`. You deploy once. They open the site, click **Connect GitHub**, scan, and leave. Each person authorizes **their** GitHub account. Closing the tab drops the report.

1. Create a GitHub OAuth App (GitHub → Settings → Developer settings → OAuth Apps). Homepage URL = your Vercel URL.
2. Authorization callback URL — add **both**:
   - `http://localhost:3000/api/github/callback` (local)
   - `https://YOUR_DOMAIN/api/github/callback` (Vercel production)
3. In Vercel → Project → Settings → Environment Variables, set (Production):

| Variable | Value |
| --- | --- |
| `APP_URL` | `https://YOUR_DOMAIN` (no trailing slash) |
| `GITHUB_CLIENT_ID` | OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | OAuth App client secret |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | any secret, 16+ characters |

Do **not** set `GITHUB_REDIRECT_URI` or `GITHUB_TOKEN` on Vercel. Callback is `{APP_URL}/api/github/callback`. `GITHUB_TOKEN` would make every visitor share one token.

4. Redeploy. Open `/scan` on the live URL and click **Connect GitHub**.

Different GitHub accounts work because each browser gets its own `ss_github` cookie. There is no product signup.

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

GitHub scan body: `{ source: "github", repositories: [{ fullName, branch? }], scanMode?, files? }`. `scanMode: "selected"` scans only `files`. Caps: 8 repositories, 80 manifests, 400 unique packages, 40 release-note lookups, 22 MB JSON body. Request timeout is 120 seconds.

Per-IP rate limits (15-minute window): **8** scans, **12** GitHub connect / PAT pastes, **60** repo list / file searches.

## Not in this product

No user accounts, stored scan history, cron re-scans, or Slack/email digests. Run a new scan when you need a fresh report.
