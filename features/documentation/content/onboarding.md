---
title: Scan flow
description: Open the site, connect GitHub or upload a file, read the report. No signup.
lastUpdated: 2026-09-01
related:
  - href: /documentation/architecture/tenancy
    title: Self-host architecture
    description: Session cookies and sessionStorage — no user tables.
  - href: /documentation/scanning
    title: Scanning & inventory
    description: How GitHub and file scans discover packages.
---

There is no account. `/login`, `/signup`, and `/onboarding` redirect away from leftover URLs.

## Public entry

```text
/  (home)
  → Scan a repository → /scan
  → Docs → /documentation

/scan
  → GitHub (OAuth or PAT) → check repo(s) → full repository or specific files → scan → /dashboard
  → SBOM JSON → scan → /dashboard
  → Manifests / lockfiles → scan → /dashboard

/dashboard  /inventory
  → Read the report in this tab
```

- Home (`/`) is public: hero, how it works, FAQ.
- `/dashboard` and `/scan` do not require a session cookie.
- Header **Scan a repository** opens `/scan`.
- **Clear scan** in the sidebar drops `sessionStorage` and the GitHub cookie.

## After the scan

The JSON report is written to `sessionStorage` (`securestack-session-scan`). Dashboard and Report (`/inventory`) read that store. Close the tab to discard it.

Package detail is `/inventory/:name` (scoped names use extra path segments, for example `/inventory/@hono/node-server`).
