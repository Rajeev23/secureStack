---
title: Findings & intelligence
description: After a scan, SecureStack checks latest versions, GitHub release notes, OSV/NVD CVE aliases, and end-of-life status, then writes findings and an update recommendation.
lastUpdated: 2026-08-28
related:
  - href: /documentation/scanning
    title: Scanning & inventory
    description: GitHub repository reads and dependency parsing.
  - href: /documentation/monitoring
    title: Scheduled monitoring
    description: Cron scans, What’s changed, and finding status.
  - href: /documentation/architecture/tenancy
    title: Company & GitHub
    description: Tokens stay on the company row.
---

A scan turns inventory into an action: **a new version exists, these are the changes, this is the security impact, and this is what we recommend.**

```text
Start Scan
  → Parse dependencies and version catalogs
  → Latest version (package registries + GitHub Releases)
  → Release notes / changelog
  → OSV (CVE aliases include NVD)
  → EOL (endoflife.date)
  → Recommendation (Update urgently / Update / Review / Wait)
  → Impact + P1–P4 (environment, security, breaking, age of fix)
  → Write findings
  → Project page (Inventory / Updates / What’s changed / Findings)
```

No extra SQL. Findings use the existing `findings` table. Release intelligence is stored on `scans.result_snapshot.components`. Intelligence is fetched live from external APIs; SecureStack does not store a global CVE database.

## Sources

| Question | Source |
| --- | --- |
| Latest version | npm registry, PyPI, crates.io, Go proxy, Maven Central, GitHub Releases (pinned binaries such as `runc`) |
| What changed | GitHub release notes between the current tag and the latest tag, then CHANGELOG.md if notes are empty |
| CVE / severity / fixed version | [OSV](https://osv.dev) (`/v1/querybatch` + `/v1/vulns/:id`). NVD CVE ids come from OSV aliases. Pinned GitHub binaries such as `runc` are queried as Go modules (`github.com/opencontainers/runc`). |
| End of life | [endoflife.date](https://endoflife.date) for runtimes and common Docker images (`node`, `python`, `postgres`, …) |

If a feed is unreachable, the scan still completes with the GitHub inventory.

## Recommendations

| Kind | When |
| --- | --- |
| `update_urgent` | The installed version has a known CVE and a newer release exists |
| `update` | Patch (or a security fix in the new release) with no known breaking change |
| `review` | Major version or breaking-change language in the notes |
| `wait` | Minor update with no known security issue and no meaningful change notes |

Click a component on Inventory, Updates, or What’s changed to see current → new, categorized changes, security, and the recommendation.

Default Inventory and Updates views show **infra** (version catalogs such as `bom.yaml`, Docker images) and **direct** dependencies from package manifests. Transitive lockfile packages appear only when they have a CVE; other transitive bumps are grouped by parent. Users should not have to inspect hundreds of `node_modules` helpers.

Updates are ranked **P1–P4**. Hover a P chip for “Why is this P1?”. Score uses severity (CVE / security notes), production usage, breaking changes, and how long the fix has been available. **Impact** is Low / Medium / High / Critical from the same inputs. Production + a security fix shows **Update within 7 days**. The project **environment** (production / staging / development) is stored on `projects.monitoring` and applied when inventory is loaded, so changing environment re-ranks without a new scan.

Findings that disappear on the next scan (the version was updated) are auto-closed as `RESOLVED`.

## Coverage limits

CVE, latest-version, and EOL checks run on at most **400 unique packages** (`MAX_INTEL_PACKAGES`), ordered infra → direct → transitive. GitHub release notes run on at most **40 outdated packages** (`MAX_RELEASE_LOOKUPS`) in the same order. Default Inventory already hides routine lockfile packages, so those limits cover the pins and declared dependencies on the page. Dashboard “updates available” counts actionable rows, not every lockfile bump.

The scanner reads at most **80 manifest files** per repository (`MAX_MANIFEST_FILES`). Remaining lockfiles are skipped so the scan stays inside the request time limit.

OSV `/v1/querybatch` is sent in chunks of 150 packages.

## Finding types

| Type | When |
| --- | --- |
| `SECURITY` | OSV reports a vulnerability for the installed version |
| `UPDATE` | Latest version is newer and there is no security finding for that package |
| `EOL` | The cycle is end of life or within 180 days of EOL |

Recommendation text always includes the current version and the upgrade target when known.

Issue type, severity, finding status, inventory version status, recommendation kind, and EOL chips all read from `config/issue-palette.ts`.

## APIs

| Request | Result |
| --- | --- |
| `GET /api/findings` | Open findings for the company |
| `GET /api/projects/:id/findings` | Findings for one project (all statuses) |
| `PATCH /api/findings/:id` | Update finding status |
| `GET /api/dashboard/stats` | Update intelligence counts plus recent updates from the latest scans |

Change status in the project **Findings** tab. `IGNORED` and `ACCEPTED_RISK` stay closed on the next scan; `RESOLVED` can reopen if the issue is detected again. See [Scheduled monitoring](/documentation/monitoring).

Re-run **Start Scan** on an existing project to populate findings and release notes for the first time.
