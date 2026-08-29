---
title: Findings & intelligence
description: After a scan, SecureStack checks latest versions, GitHub release notes, OSV/NVD CVE aliases, and end-of-life status, then shows findings from that snapshot.
lastUpdated: 2026-08-29
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
  → Project page (`/projects/:id/overview`, Inventory, Scans)
```

No extra SQL. Findings are derived from the latest `scans.result_snapshot` when you open the page. They are not inserted into the `findings` table. Status (ignored / accepted risk) is not stored yet. Release intelligence lives on `scans.result_snapshot.components`. Intelligence is fetched live from external APIs; SecureStack does not store a global CVE database.

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

Open a package from Inventory (`/projects/:id/inventory/:name`) to see current → new, categorized changes, security, findings, and the recommendation.

The inventory table splits rank from action. **Priority** is P1–P4 (hover for why). **Status** is one action chip — Update urgently, Review required, Update recommended, or Up to date — plus a CVE count when OSV matched. Major/minor bump size is not repeated next to the action. **Impact** stays its own column.

Default Inventory and Updates views show **infra** (version catalogs such as `bom.yaml`, Docker images) and **direct** dependencies from package manifests. Transitive lockfile packages appear only when they have a CVE; other transitive bumps are grouped by parent. Users should not have to inspect hundreds of `node_modules` helpers.

Updates are ranked **P1–P4**. Score uses severity (CVE / security notes), production usage, breaking changes, and how long the fix has been available. **Impact** is Low / Medium / High / Critical from the same inputs. Production + a security fix shows **Update within 7 days**. The project **environment** (production / staging / development) is stored on `projects.monitoring` and applied when inventory is loaded, so changing environment re-ranks without a new scan.

Findings refresh from the latest scan. If a version is updated, that CVE or outdated-package row disappears on the next scan. Finding status (ignored / accepted risk) is not stored yet.

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

Issue type, severity, finding status, inventory version status, recommendation kind, and EOL chips all read from `config/issue-palette.ts`. Colors come from shared `TOKENS` (critical, danger, warning, caution, info, success, special, neutral). Change a token there and every chip updates.

## APIs

| Request | Result |
| --- | --- |
| `GET /api/findings` | Findings from each project’s latest completed scan |
| `GET /api/projects/:id/findings` | Findings for one project, from its latest scan |
| `PATCH /api/findings/:id` | Not stored yet (`501`) |
| `GET /api/dashboard/stats` | Update intelligence counts plus recent updates from the latest scans |

Status changes are not saved. Re-run **Start Scan** on an existing project to refresh findings and release notes.
