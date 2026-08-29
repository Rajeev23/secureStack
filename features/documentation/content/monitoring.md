---
title: Scheduled monitoring
description: Hourly cron re-scans due projects, diffs inventories, refreshes release notes, sends Slack/email alerts, and refreshes findings from the new snapshot.
lastUpdated: 2026-08-29
related:
  - href: /documentation/scanning
    title: Scanning & inventory
    description: GitHub repository reads and dependency parsing.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: OSV, latest versions, EOL, and finding status.
  - href: /documentation/architecture/tenancy
    title: Company & GitHub
    description: Tokens and monitoring JSON stay on existing tables.
---

Phase 4 watches connected repositories on a schedule. Each due scan re-reads GitHub, refreshes intelligence, diffs the previous inventory, and the Findings tab reads the new snapshot.

```text
Vercel Cron (hourly) or Settings → Scan due projects now
  → Projects whose interval has elapsed
  → Same scan path as Start Scan (source: schedule)
  → Diff previous snapshot
  → Slack / email for security updates, critical findings, and scan failures
  → Package page (`/projects/:id/inventory/:name`) for upstream current → latest
  → Findings on that package page (derived from the new snapshot)
```

No sixth table. Interval and alert flags live on `companies.monitoring`. Per-project on/off, environment, and scan scope (`scanMode`, `files`) live on `projects.monitoring`.

If you already ran `01-schema.sql` before this column existed, run `docs/supabase/04-phase4.sql` once in the SQL Editor.

## Schedule

| Setting | Where |
| --- | --- |
| Interval (`0`, `6`, `12`, `24`, `48`, `168` hours) | Settings → Company |
| Slack incoming webhook | Settings → Company (URL is never returned after save) |
| Alert email + daily/weekly digest | Settings → Company (email needs `RESEND_API_KEY` and `NOTIFY_FROM_EMAIL`) |
| Alerts on the dashboard | Settings → Company |
| Environment (production / staging / development) | Project overview |
| Include this project | Project overview checkbox |
| Full repo vs selected files | Project connect step, then overview |
| Run due scans locally | Settings → **Scan due projects now** |

`0` means manual scans only. Default is every 24 hours, alerts on, project included.

Production uses Vercel Cron (`vercel.json`) hitting `GET /api/cron/scans` with `CRON_SECRET`. Each tick scans at most three due projects. Failed scans retry after one hour (or the interval, whichever is shorter). A scan stuck `running`/`pending` for more than 45 minutes is treated as due.

## What’s changed

**What’s changed** is **upstream**: your current version vs the latest release, with GitHub release notes (and CHANGELOG.md when notes are missing) classified as security / bug fix / breaking / other, plus Update urgently / Update / Review / Wait. It is shown on the package page (`/projects/:id/inventory/:name`), not as a separate project tab.

A completed scan also stores `result_snapshot.changes`: added/removed components, version moves in *your* repo, new and resolved CVEs. That scan-to-scan diff lives under **Scans** as **Since last scan**.

## Finding lifecycle

Findings are computed from the latest scan snapshot. They are not written to `findings`. Status (Open / Ignored / Accepted risk) is not stored yet; every row shows as Open. When a later scan no longer detects an issue, it simply drops off the list.

`PATCH /api/findings/:id` returns `501` until status is persisted.

## APIs

| Request | Result |
| --- | --- |
| `GET` / `POST /api/cron/scans` | Worker for Vercel Cron. Requires `Authorization: Bearer CRON_SECRET` or `x-cron-secret`. |
| `POST /api/scans/scheduled` | Session-authenticated. Runs due scans for **this company only**. |
| `PATCH /api/company` | `scanIntervalHours`, `alertsEnabled`, `slackWebhookUrl`, `notifyEmail`, `digestMode`, and/or `name`. Slack URL is write-only. |
| `PATCH /api/projects/:id` | `{ monitoringEnabled }`, `{ environment }`, `{ scanMode, files }`, or `{ repositories }` (exactly one repository). |
| `DELETE /api/projects/:id` | Remove the project. Scans and findings cascade. |
| `PATCH /api/findings/:id` | Not stored yet (`501`). |

Registry and OSV HTTP responses are cached in-process for 30 minutes.
