---
title: Overview
description: SecureStack is patch and dependency update intelligence. Connect GitHub or upload a file. No accounts. Nothing stored.
lastUpdated: 2026-09-01
related:
  - href: /documentation/connect
    title: Connect GitHub
    description: OAuth, a personal access token, or a server token.
  - href: /documentation/scan
    title: Run a scan
    description: GitHub, an SBOM, or manifests — then what the scanner does.
  - href: /documentation/report
    title: Read the report
    description: Dashboard, Report, and package detail in this tab.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: CVEs, latest versions, EOL, and upgrade recommendations.
---

**SecureStack** tells you what open-source software you ship, whether a newer version exists, what changed, and whether you should update.

There is **no signup** and **no user database**. You connect GitHub or upload a file. The server reads the repo or the file, fetches intelligence, and returns a JSON report. That report stays in **this browser tab**. Close the tab (or click **Clear scan**) and it is gone.

## What you get

1. A list of packages and pinned binaries actually in use.
2. **Current vs latest**, with release notes when GitHub publishes them.
3. **CVEs** (via OSV, including NVD aliases) and **end-of-life** software.
4. A recommendation: **Update urgently**, **Update**, **Review**, or **Wait**, plus P1–P4 priority.

## How a session works

```text
/scan
  → Connect GitHub  or  upload an SBOM  or  upload manifests
  → Server parses files and checks OSV / registries / EOL
  → JSON report returned once
  → Dashboard and Report read it from this tab
```

| You | The product |
| --- | --- |
| [Connect GitHub](/documentation/connect) | Short-lived encrypted cookie. Token never written to a database. |
| [Run a scan](/documentation/scan) | GitHub (up to 8 repos), CycloneDX/SPDX JSON, or up to 40 files. |
| [Read the report](/documentation/report) | Dashboard, Report (`/inventory`), package pages. |
| Close the tab | Report discarded. Cookie expires in about an hour. |

File and SBOM scans do not need GitHub.

## Pages in the app

| Page | What it shows |
| --- | --- |
| `/` | Public home |
| `/scan` | Connect GitHub or upload a file |
| `/dashboard` | KPIs and a feed from the last scan |
| `/inventory` | Report — infra pins and declared dependencies |
| `/inventory/:name` | One package: current → new, changes, security, recommendation |
| `/settings/preferences` | Theme and layout only |
| `/documentation` | This site |

`/updates` and `/findings` still work if you open the URL. They are not in the product sidebar.

## What this product does not do

- Create accounts, companies, or projects
- Store scan history or GitHub tokens in a database
- Re-scan on a schedule, or send Slack/email alerts
- Open pull requests or apply patches

To watch a repository over time, run a new scan when you need a fresh report. See [Self-host](/documentation/self-host) to run the app yourself.

## Source

SecureStack is MIT-licensed. The repository is [github.com/Rajeev23/secureStack](https://github.com/Rajeev23/secureStack).
