---
title: Company & GitHub
description: Accounts are companies. Projects belong to a company. GitHub tokens stay on the server.
lastUpdated: 2026-08-27
related:
  - href: /documentation/onboarding
    title: Onboarding
    description: Sign up, name the company, then open the dashboard.
  - href: /documentation/scanning
    title: Scanning & inventory
    description: Read GitHub and list real dependencies.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: CVEs, latest versions, and EOL.
  - href: /documentation/monitoring
    title: Scheduled monitoring
    description: Cron scans and finding status.
---

Every customer account is a **company**. Do not call this a tenant in the product UI. Database keys use `company_id`.

```text
Company
 ├── Users
 └── Projects
      ├── Repository (one GitHub repo, JSON on the project)
      ├── Scans
      └── Findings
```

Auth lives in **Supabase Auth**. The application `users` row links `auth.users.id` to a company. The first user is **ADMIN**.

GitHub OAuth is a separate GitHub OAuth App (not “Login with GitHub”). The access token is encrypted and stored on `companies.github_connection`. API responses never return the token. Each project connects **one** GitHub repository. **Start Scan** reads that repo and stores components on `scans.result_snapshot`. Findings (CVE, outdated, EOL) are written to `findings`. Scan interval lives on `companies.monitoring`; per-project on/off on `projects.monitoring`. See [Scanning & inventory](/documentation/scanning), [Findings & intelligence](/documentation/intelligence), and [Scheduled monitoring](/documentation/monitoring).

Schema SQL to run in the Supabase SQL Editor lives in [`docs/supabase/`](/docs/supabase) in the repo (see the developer handoff).
