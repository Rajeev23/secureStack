---
title: Scheduled monitoring
description: This self-host mode does not store tokens, so it cannot re-scan on a schedule.
lastUpdated: 2026-08-31
related:
  - href: /documentation/scanning
    title: Scanning & inventory
    description: GitHub repository reads and dependency parsing.
  - href: /documentation/architecture/tenancy
    title: Self-host architecture
    description: Session-only GitHub access.
---

Scheduled monitoring needs a stored GitHub token and scan history. **This product mode stores neither**, so cron scans, Slack/email digests, and scan-to-scan trends are not available.

To watch a repository over time, run a scan when you need a new report, or self-host a future optional persistence layer.

Leftover `/api/cron/scans` routes from the earlier company SaaS still exist in the repository; the UI does not use them.
