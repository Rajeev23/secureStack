---
title: Read the report
description: After a scan, Dashboard and Report read the JSON in this browser tab. Open a package for current vs latest, what changed, and a recommendation.
lastUpdated: 2026-09-01
related:
  - href: /documentation/scan
    title: Run a scan
    description: How GitHub, SBOM, and file scans produce the report.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: What P1–P4, CVEs, and recommendations mean.
---

When a scan finishes, the UI writes the JSON to `sessionStorage` (`securestack-session-scan`) and opens `/dashboard`. Nothing is inserted into a database. **Close the tab** or click **Clear scan** to discard it.

## Dashboard (`/dashboard`)

Empty until you scan. After a scan you get:

- Counts: packages found, updates, findings, coverage
- **Priority mix** (P1–P4)
- A short feed of updates and findings

**New scan** returns to `/scan`. The last report stays until you replace it or clear it.

## Report (`/inventory`)

This is the inventory list in the product sidebar.

| Column | Meaning |
| --- | --- |
| Component | Package name — open it for detail |
| Tier | Infra pin, direct dependency, or transitive |
| Current / Latest | Installed version vs newest known |
| Priority | P1–P4 (hover for why) |
| Status | Update urgently, Review required, Update recommended, or Up to date, plus a CVE count when OSV matched |

Default view: **infra + declared dependencies**. Transitive lockfile rows stay hidden unless they have a CVE. Use the toggle on the page if you need the rest of the lockfile.

## Package (`/inventory/:name`)

Open a row for:

- Current → recommended / latest
- Categorized changes (security, breaking, bugfix, …) from GitHub notes
- CVEs and EOL
- The recommendation and P1–P4

Scoped names use extra path segments, for example `/inventory/@hono/node-server`.

## Updates and findings

These routes are **not** in the sidebar. They still read the same in-tab report:

| URL | Content |
| --- | --- |
| `/updates` | Packages with a newer version and a recommended action |
| `/findings` | Security, outdated, and EOL findings (no workflow status — there is no ignore/accept state) |

Click a row to open the same package page.

## Start over

| Action | Effect |
| --- | --- |
| **New scan** | `/scan` — a successful scan **replaces** the report in this tab |
| **Clear scan** | Drops `sessionStorage` and the GitHub cookie |
| Close the tab | Report is gone. GitHub cookie expires in about an hour |
