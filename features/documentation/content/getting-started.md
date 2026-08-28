---
title: Overview
description: SecureStack is patch and dependency update intelligence. This guide covers the current foundation and what comes next.
lastUpdated: 2026-08-28
related:
  - href: /documentation/boilerplate-patterns
    title: Project patterns
    description: Follow the project structure when you add a product feature.
  - href: /documentation/architecture/tenancy
    title: Company & GitHub
    description: Choose the simple account model or the full hierarchy.
  - href: /documentation/onboarding
    title: Onboarding
    description: Understand the signup-to-dashboard sequence in both tenancy modes.
  - href: /documentation/scanning
    title: Scanning & inventory
    description: Read GitHub and list real dependencies.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: CVEs, latest versions, EOL, and upgrade recommendations.
  - href: /documentation/monitoring
    title: Scheduled monitoring
    description: Cron scans, What’s changed, and finding status.
  - href: /documentation/ui
    title: UI components
    description: Browse live examples of the shared design-system components.
---

**SecureStack** is **patch and dependency update intelligence**. A company connects GitHub repositories. The product discovers open-source components, tracks current and latest versions, explains what changed, flags CVEs and EOL software, and recommends whether to update. Inventory is discovery — not the whole product.

This repository includes the public home page, application shell, **Supabase Auth**, **company** accounts, **projects**, **real GitHub connection**, **repository scanning**, **SBOM upload**, **findings (CVE / latest version / release notes / EOL / P1–P4)**, **scheduled monitoring with Slack/email**, and public documentation.

## Product flow (target)

1. Connect a **Git repository** or upload an **SBOM**.
2. Discover all open-source components in use.
3. Identify the **current version** of each component.
4. Track **latest versions and releases**.
5. Detect **CVEs, security vulnerabilities, and EOL software**.
6. Explain **what changed** between the company's version and the latest.
7. Identify **breaking changes and upgrade risks**.
8. Prioritize **which patches should be applied first**.
9. Show security and engineering teams a **single view of open-source software health**.

## What is included today

| Area | Ready to reuse |
| --- | --- |
| Application shell | Responsive sidebar, header, breadcrumbs, command menu, notifications, and light/dark theme |
| Public home | Marketing page at `/` with Sign in in the header and Sign up (name, email, password) |
| Authentication | Supabase Auth email/password; name on signup; company name on `/onboarding`; forgot password; Settings → Account |
| Company | One company per signup; projects and GitHub connection belong to that company |
| Feature structure | Thin App Router routes backed by self-contained modules under `features/` |
| Data UI | Shared table primitive, forms, feedback states, and live component examples |
| Developer workflow | Type checking, tests, navigation validation, production builds, CI, and synchronized documentation |

Dashboard metrics come from the latest completed scans and open findings. The sidebar is Dashboard and Settings until the first project exists; then Projects appears. With two or more projects, names nest under Projects. Inventory, updates, findings, and scans open on a project.

## Account language

Every customer is a **company**. Do not use tenant in product copy. Projects, scans, and findings are scoped by `company_id`.

## Why the structure matters

The repository separates routing, product features, server-side domain logic, and shared UI. That keeps route files small and makes it clear where new work belongs:

```text
app/          routes, layouts, loading, and API handlers
features/     product pages, feature UI, hooks, and example data
services/     GitHub, scanner, intelligence, monitoring, and company DB workflows
components/   shared layout, feedback, and design-system components
config/       application and navigation configuration
lib/          reusable utilities and client helpers
stores/       global UI and company-context state
server/       Supabase clients (Auth + Postgres)
```

Start with [Project patterns](/documentation/boilerplate-patterns) before adding a feature. It explains the route → feature → navigation flow and points to reference implementations already in the repository.

## Company accounts

Accounts are companies. After signup, `/onboarding` collects the company name. Then add a project and connect GitHub. See [Company & GitHub](/documentation/architecture/tenancy) and [Onboarding](/documentation/onboarding).

## Run it locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

pnpm 11 blocks dependency build scripts until they are listed in `pnpm-workspace.yaml` under `allowBuilds`. This repo already allows `esbuild`, `sharp`, and `unrs-resolver`.

Open `http://localhost:3000` for the public home page. Create an account with email and password, then name your company. Follow `docs/supabase/README.md` before signing up.

## Recommended first steps

1. Create a Supabase project and run the SQL in `docs/supabase/`.
2. Create a GitHub OAuth App for repository access.
3. Read [Project patterns](/documentation/boilerplate-patterns) before adding a feature.
4. Skim [Scheduled monitoring](/documentation/monitoring) after the first scan.
5. Browse [UI components](/documentation/ui) before creating a new primitive.
6. Run `pnpm check` before pushing.

## Open source and community

The project is licensed under **MIT**, so you can use, modify, and distribute it in personal or commercial work under the license terms. Contributions should preserve the architecture, include tests for behavior changes, and update the matching documentation in the same pull request.

See `CONTRIBUTING.md` for contribution expectations and `docs/HANDOFF.md` for the technical handoff. The public documentation you are reading lives at `/documentation` and describes this repository’s real implementation.
