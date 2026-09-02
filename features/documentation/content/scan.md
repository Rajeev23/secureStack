---
title: Run a scan
description: How to scan GitHub, an SBOM, or manifest files, and what the scanner does with them.
lastUpdated: 2026-09-01
related:
  - href: /documentation/connect
    title: Connect GitHub
    description: OAuth or a personal access token before a GitHub scan.
  - href: /documentation/report
    title: Read the report
    description: Dashboard, Report, and package pages after the scan.
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: CVEs, latest versions, EOL, and recommendations.
---

A scan runs **in this request**. The server reads GitHub or your upload, parses dependency files, asks external intelligence APIs, and returns one JSON report. That report is **not** saved on the server. The UI keeps it in this tab and opens `/dashboard`.

On `/scan`, pick a source: **GitHub**, **SBOM**, or **Manifests**.

## GitHub

[Connect GitHub](/documentation/connect) first. Then:

1. Search the repository list if you need to.
2. Check **one or more repositories** (maximum **8**). Several repos are merged into **one** report.
3. Click **Continue**.
4. Choose **Entire GitHub repository** (known manifests such as `package.json`, lockfiles, `bom.yaml`) or **Specific files**.
5. Click **Scan**. When it finishes, you land on the dashboard.

**Specific files** is available when **exactly one** repository is selected. Search by name (`package.json`, `bom.yaml`, or a custom path), add paths (maximum **80**), then scan. Only those files are read.

A full repository scan walks the GitHub tree and takes up to **80** known manifest files per repository (catalogs and declared manifests first, then lockfiles). Remaining lockfiles are skipped so the request stays inside the time limit.

## SBOM

Switch to **SBOM** and upload **CycloneDX or SPDX JSON**. The file is parsed in memory and discarded. Invalid JSON shows “Upload CycloneDX or SPDX JSON.”

## Manifests

Switch to **Manifests** and upload files (`package.json`, lockfiles, `bom.yaml`, and the rest of the list below). Maximum **40** files, **500,000** characters each. They are parsed in memory and discarded.

## What happens on the server

```text
POST /api/session/scan
  → Read GitHub tree or chosen paths  or  parse the upload
  → Parse dependency files and version catalogs
  → Latest version, GitHub release notes, OSV, EOL, impact, P1–P4
  → Return JSON (not written to a database)
  → UI stores the report in this tab
```

Lockfile versions win over range specifiers in manifests. Version catalogs pin infrastructure the same way `runc: version: "1.4.2"` works in `bom.yaml` or `versions.yaml`. Nested `components:` maps (Helm charts, operators) are included.

Intelligence (latest version, OSV, EOL) runs on at most **400 unique packages**, **infra and direct first**. GitHub release notes run on at most **40** outdated packages. Details: [Findings & intelligence](/documentation/intelligence).

If an intelligence feed is down, the scan still finishes with the inventory it already parsed.

## Files the scanner recognizes

`package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `requirements.txt`, `Pipfile`, `poetry.lock`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Cargo.lock`, `Gemfile`, `Gemfile.lock`, `composer.json`, `composer.lock`, `pom.xml`, `build.gradle`, `Dockerfile`, `docker-compose.yml`, `bom.yaml`, `bom.yml`, `versions.yaml`, `versions.yml`, `tools.yaml`, `tools.yml`.

## What the Report shows by default

Report is **not** a `node_modules` dump. It lists **infrastructure pins** (version catalogs, Docker images) and **declared dependencies**. Transitive lockfile packages stay hidden unless they have a CVE. You can include the rest of the lockfile from the Report page.

## Limits

| Limit | Value |
| --- | --- |
| GitHub repositories per scan | 8 |
| Manifest files read per GitHub repository | 80 |
| Files in a “specific files” scan | 80 |
| Uploaded manifest files | 40 |
| Unique packages checked for CVE / latest / EOL | 400 (infra → direct → transitive) |
| GitHub release-note lookups | 40 |
| JSON request body | 22 MB |
| Scans per IP | 8 per 15 minutes |
| GitHub connect / PAT paste per IP | 12 per 15 minutes |
| GitHub repo list / file search per IP | 60 per 15 minutes |
| Request time budget | 120 seconds |
