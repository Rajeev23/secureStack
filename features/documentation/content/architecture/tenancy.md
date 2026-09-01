---
title: Self-host architecture
description: No accounts. No user database. GitHub tokens stay in a session cookie. Scan results stay in the browser.
lastUpdated: 2026-08-31
related:
  - href: /documentation/onboarding
    title: Scan flow
    description: Connect GitHub or upload a file, then read the report.
  - href: /documentation/scanning
    title: Scanning & inventory
    description: Read GitHub and list real dependencies.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: CVEs, latest versions, and EOL.
---

SecureStack in this mode does **not** create companies, users, or projects. There is no Supabase requirement for the scan → dashboard path.

```text
Browser
  → Connect GitHub (OAuth / PAT) or upload a file
  → POST /api/session/scan
  → Scanner + intelligence (OSV, registries, EOL)
  → JSON report
  → sessionStorage in this tab
```

## What is stored where

| Data | Where | Lifetime |
| --- | --- | --- |
| GitHub access token | httpOnly cookie `ss_github` (encrypted) or `GITHUB_TOKEN` env | About one hour, or process lifetime for env |
| Scan report | Browser `sessionStorage` | Until you close the tab or click Clear scan |
| Package intelligence (OSV, versions) | Fetched live during the scan | Not persisted as user data |

The server does not insert rows into `companies`, `users`, `projects`, `scans`, or `findings` for this flow.

## GitHub

GitHub OAuth is repository access, not product login. Start it with `GET /api/session/github?connect=1`. The callback writes the token into the session cookie and redirects to `/scan`. You can also `POST /api/session/github` with a personal access token.

API responses never return the token to JavaScript. Listing repos and scanning happen on the server.

## Scan APIs

| Route | Purpose |
| --- | --- |
| `GET /api/session/github` | Connected? login + repository list |
| `POST /api/session/github` | Save a PAT in the session cookie |
| `DELETE /api/session/github` | Drop the cookie |
| `POST /api/session/scan` | `{ source: "github" \| "sbom" \| "files" }` → enriched report |

Scans are rate-limited per IP. GitHub reads still use the same caps as before: 400 unique packages, 80 manifests, 40 release-note lookups.

Company-scoped routes under `/api/projects` and `/api/auth` still exist in the repo from the earlier SaaS path. The UI does not call them.
