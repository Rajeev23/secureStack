---
title: Findings & intelligence
description: After inventory is parsed, SecureStack checks latest versions, GitHub release notes, OSV CVEs, and end-of-life status, then recommends whether to update.
lastUpdated: 2026-09-01
related:
  - href: /documentation/scan
    title: Run a scan
    description: How packages are discovered before intelligence runs.
  - href: /documentation/report
    title: Read the report
    description: Where findings appear on Dashboard, Report, and package pages.
---

A scan turns a package list into a decision: **a newer version exists, these are the changes, this is the security impact, and this is what we recommend.**

```text
Parsed inventory
  → Latest version (registries + GitHub Releases)
  → Release notes / changelog
  → OSV (CVE aliases include NVD)
  → EOL (endoflife.date)
  → Recommendation + impact + P1–P4
  → Dashboard / Report / package page
```

Intelligence is fetched **live** during the scan. SecureStack does not keep a CVE database or finding history. There is no “ignored” or “accepted risk” status. If you upgrade and scan again, that CVE or outdated row is simply gone.

## Sources

| Question | Source |
| --- | --- |
| Latest version | npm, PyPI, crates.io, Go proxy, Maven Central, GitHub Releases (pinned binaries such as `runc`) |
| What changed | GitHub release notes between the current tag and the latest tag; `CHANGELOG.md` if notes are empty |
| CVE / severity / fixed version | [OSV](https://osv.dev). NVD CVE ids come from OSV aliases. Pinned GitHub binaries such as `runc` are queried as Go modules (`github.com/opencontainers/runc`). |
| End of life | [endoflife.date](https://endoflife.date) for runtimes and common images (`node`, `python`, `postgres`, …) |

If a feed is unreachable, the scan still completes with the inventory it already has.

## Finding types

| Type | When it appears |
| --- | --- |
| Security | OSV reports a vulnerability for the installed version |
| Update | A newer version exists and there is no security finding for that package |
| EOL | The cycle is end of life, or within 180 days of EOL |

## Recommendations

Shown as chips on Report and on the package page:

| You see | When |
| --- | --- |
| **Update urgently** | Installed version has a known CVE and a newer release exists |
| **Update** | Patch (or a security fix in the new release) with no known breaking change |
| **Review** | Major version, or breaking-change language in the notes |
| **Wait** | Minor update, no known security issue, no meaningful change notes |

Recommendation text includes the current version and the upgrade target when they are known.

## Priority and impact

**Priority** is P1–P4 (hover on the chip for why). Score uses CVE / security notes, breaking changes, and how long the fix has been available.

**Impact** is Low / Medium / High / Critical from the same inputs.

This product has no project “environment” setting. Session scans treat environment as unknown, so ranking does not apply a production bonus.

Dashboard “updates available” counts **actionable** rows (infra, declared dependencies, and transitives with a CVE), not every lockfile bump.

## Coverage limits

| Check | Cap | Order |
| --- | --- | --- |
| CVE, latest version, EOL | 400 unique packages | Infra → direct → transitive |
| GitHub release notes | 40 outdated packages | Same order |
| OSV querybatch | Chunks of 150 packages | — |

Default Report already hides routine lockfile packages, so the 400-package budget covers what you see on the page.

Open a package from Report to see current → new, categorized changes, security, and the recommendation together. The findings table at `/findings` is the same snapshot. It has no Open / In progress / Closed column — this product does not keep finding workflow.
