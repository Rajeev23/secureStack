---
title: Overview
description: SecureStack is patch and dependency update intelligence. Scan GitHub or a file. No accounts. Nothing stored.
lastUpdated: 2026-09-01
related:
  - href: /documentation/boilerplate-patterns
    title: Project patterns
    description: Follow the project structure when you add a product feature.
  - href: /documentation/architecture/tenancy
    title: Self-host architecture
    description: Session scans with no user database.
  - href: /documentation/onboarding
    title: Scan flow
    description: Connect GitHub or upload a file, then read the report.
  - href: /documentation/scanning
    title: Scanning & inventory
    description: Read GitHub and list real dependencies.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: CVEs, latest versions, EOL, and upgrade recommendations.
  - href: /documentation/ui
    title: UI components
    description: Browse live examples of the shared design-system components.
---

**SecureStack** is **patch and dependency update intelligence**. You connect a GitHub repository or upload a file. The product discovers open-source components, tracks current and latest versions, explains what changed, flags CVEs and EOL software, and recommends whether to update.

This mode has **no signup**, **no company records**, and **no database of your scan**. Results stay in the browser tab. A GitHub token, if you connect one, is held in a short-lived httpOnly cookie so the server can read the repo — it is not written to Postgres.

## Product flow

1. Open `/` or `/scan`.
2. Connect **GitHub** (OAuth or a personal access token) **or** upload an **SBOM** / manifests.
3. Discover open-source components in use.
4. Compare **current vs latest**, including release notes when they exist.
5. Detect **CVEs, security vulnerabilities, and EOL software**.
6. Get **Update urgently / Update / Review / Wait**.
7. Close the tab — the report is gone.

## What is included today

| Area | Ready to reuse |
| --- | --- |
| Application shell | Responsive sidebar, header, breadcrumbs, and light/dark theme |
| Public home | Marketing page at `/` with Scan a repository (no Sign in / Sign up) |
| Session scan | `POST /api/session/scan` — GitHub, CycloneDX/SPDX, or uploaded manifests |
| GitHub | OAuth or PAT in an encrypted session cookie. Optional `GITHUB_TOKEN` env on the server |
| Feature structure | Thin App Router routes backed by self-contained modules under `features/` |
| Developer workflow | Type checking, tests, navigation validation, production builds, CI, and synchronized documentation |

Dashboard and Report (`/inventory`) read the last scan from `sessionStorage`. Nothing is inserted into `companies`, `users`, `projects`, `scans`, or `findings`.

## Why the structure matters

The repository separates routing, product features, server-side domain logic, and shared UI:

```text
app/          routes, layouts, loading, and API handlers
features/     product pages, feature UI, hooks, and session stores
services/     GitHub, scanner, intelligence, and session-scan (no DB)
components/   shared layout, feedback, and design-system components
config/       application and navigation configuration
lib/          reusable utilities and client helpers
stores/       global UI chrome state
```

Start with [Project patterns](/documentation/boilerplate-patterns) before adding a feature.

## Self-host

```bash
pnpm install
cp .env.example .env.local
```

Set `APP_URL`, GitHub OAuth **or** `GITHUB_TOKEN`, and `GITHUB_TOKEN_ENCRYPTION_KEY` if you use OAuth or a pasted PAT. You do **not** need Supabase for this flow.

```bash
pnpm dev
```

Open `http://localhost:3000`, then **Scan a repository**.

pnpm 11 blocks dependency build scripts until they are listed in `pnpm-workspace.yaml` under `allowBuilds`. This repo already allows `esbuild`, `sharp`, and `unrs-resolver`.

## Recommended first steps

1. Create a GitHub OAuth App (callback `http://localhost:3000/api/github/callback`) **or** export `GITHUB_TOKEN`.
2. Read [Self-host architecture](/documentation/architecture/tenancy).
3. Read [Scan flow](/documentation/onboarding).
4. Browse [UI components](/documentation/ui) before creating a new primitive.
5. Run `pnpm check` before pushing.

## Open source and community

The project is licensed under **MIT**. Contributions should preserve the architecture, include tests for behavior changes, and update the matching documentation in the same pull request.

See `CONTRIBUTING.md` and `docs/HANDOFF.md`. The public documentation you are reading lives at `/documentation`.
