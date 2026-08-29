---
title: Company label
description: How the sidebar shows the current company.
lastUpdated: 2026-08-29
related:
  - href: /documentation/architecture/tenancy
    title: Company & GitHub
    description: Company isolation and GitHub token storage.
  - href: /documentation/layout/sidebar
    title: Sidebar
    description: Config-driven navigation below the company label.
---

The sidebar header shows the **company name**. Phase 1 is one company per user, so there is no switcher dropdown.

Company data comes from `GET /api/company/context` into `stores/company-context-store.ts`.

| Route | Purpose |
| --- | --- |
| `/settings/account` | Your name, email, and update password |
| `/settings/company` | Edit company name, scan interval, and alerts |
| `/projects` | List projects. Hidden from the sidebar until the first project exists. With two or more, names also nest under sidebar Projects. |
| `/projects/new` | Create a project, then connect GitHub |
| `/projects/:id/overview` | Repository, files to monitor, and scan status |
| `/projects/:id/inventory` | Components in that project |
| `/projects/:id/inventory/:name` | Current → new, what changed, and findings for one package |
