---
title: Scanning & inventory
description: Reads connected GitHub repositories, parses dependency files and version catalogs, then enriches components with latest versions, release notes, CVEs, and EOL.
lastUpdated: 2026-08-29
related:
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: OSV, latest versions, release notes, EOL, and recommendations.
  - href: /documentation/monitoring
    title: Scheduled monitoring
    description: Cron scans, What’s changed, and finding status.
  - href: /documentation/architecture/tenancy
    title: Company & GitHub
    description: GitHub tokens stay on the company row.
  - href: /documentation/onboarding
    title: Onboarding
    description: Create a company before connecting projects.
---

After a project has one GitHub repository **and** a scan scope, **Start Scan** on that project reads the repo on the server, lists open-source components, then checks external intelligence. Connecting GitHub does not start a scan.

Inventory is **discovery** (what you use). Open a package at `/projects/:id/inventory/:name` for current → new, what changed, security, and a recommendation.

```text
Add project → Connect GitHub (resumes if you go back, refresh, or cancel)
  → Select one repository
  → Choose scan scope: entire GitHub repository **or** selected files
  → /projects/:id/overview → Start Scan
  → Create scan row (pending → running)
  → Read GitHub tree **or** only the saved file list **or** parse CycloneDX/SPDX JSON
  → Parse dependency files and version catalogs
  → Save result_snapshot
  → Latest version / GitHub releases / OSV / EOL / impact / P1–P4
  → Overview / Inventory / Scans. Package detail is a page, not a dialog.
```

No new tables. Scan scope lives on `projects.monitoring` (`scanMode`, `files`). Components and release intelligence live on `scans.result_snapshot`. Findings are derived from that snapshot (not stored in `findings`). See [Findings & intelligence](/documentation/intelligence).

## Scan scope

After the repository is chosen, the company picks **what to monitor**. That choice is stored on the project and reused for manual and scheduled scans.

| Option | What is read |
| --- | --- |
| Entire GitHub repository | Known manifests (package.json, lockfiles, bom.yaml, and the rest of the list below). |
| Selected files | Only the paths you search and add. Use this when the company pins versions in a custom filename, or only wants `package.json` / only `bom.yaml`. |

Change the list later on the project overview. GitHub status is on the left of that card; files to monitor (full repo or search-and-add paths) stay on the right.

## Supported files

`package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `requirements.txt`, `Pipfile`, `poetry.lock`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Cargo.lock`, `Gemfile`, `Gemfile.lock`, `composer.json`, `composer.lock`, `pom.xml`, `build.gradle`, `Dockerfile`, `docker-compose.yml`, `bom.yaml`, `bom.yml`, `versions.yaml`, `versions.yml`, `tools.yaml`, `tools.yml`.

After **Continue**, the project is saved. Opening it again, using Back, or refreshing returns you to **Connect GitHub** until a repository is linked **and** scan scope is saved. **Continue without GitHub** on that page is for SBOM-only setup.

Upload a **CycloneDX** or **SPDX** JSON SBOM on the project overview (`POST /api/projects/:id/sbom`). That scan uses `source: sbom` and does not require a GitHub repository. GitLab/Bitbucket remotes and deep OS-package image extraction are not in this release.

Lockfile versions win over range specifiers in manifests. Version catalogs pin infrastructure the same way a company pins `runc: version: "1.4.2"` in `bom.yaml` or `versions.yaml`. `docs` / `url` / `manifest_url` become the GitHub release feed so Inventory can show **current → latest**, impact, and a recommendation. Nested `components:` maps (Helm charts, operators) are included. The scanner also reads YAML under `components/`, `versions/`, and `tools/` when the file looks like that catalog shape.

Default Inventory is **not** a node_modules dump. It shows **infra pins + declared dependencies**. Transitive lockfile packages (`@alloc/quick-lru` and similar) stay hidden unless they have a CVE. Updates groups those routine transitive bumps by parent instead of listing each helper package.

A scan reads at most 80 manifest files per repository (catalogs and declared manifests first, then lockfiles). Intelligence (latest version, OSV, EOL) runs on at most 400 unique packages, **infra and direct first**. GitHub release notes run on at most 40 outdated packages. See [Findings & intelligence](/documentation/intelligence).

## APIs

| Request | Result |
| --- | --- |
| `POST /api/projects/:id/scans` | Create and run a scan. Returns the scan, including `failed` with `error`. |
| `PATCH /api/projects/:id` | Connect `{ repositories }` (exactly one) with optional `{ scanMode, files }`, or update monitoring / scan scope. |
| `GET /api/github/repository-files` | Search blob paths in a repo the company can read (`fullName`, `branch`, `q`). Paths only. |
| `POST /api/projects/:id/sbom` | Import CycloneDX or SPDX JSON (`{ document }`). Same enrich path as a repo scan. |
| `GET /api/projects/:id/scans` | Scan history (no component tree in the snapshot) |
| `GET /api/projects/:id/components` | Paginated components from the latest completed scan (`offset`, `limit`, `name` for one package including transitives, coverage, available updates, scan-to-scan diff) |
| `DELETE /api/projects/:id` | Remove the project and cascade its scans and findings |
| `GET /api/inventory` | Paginated company-wide inventory (`offset`, `limit`). `outdated=1` returns available updates only. |
| `GET /api/scans` | Company scan history |
| `GET /api/scans/:id` | One scan, including snapshot |

GitHub tokens never leave the server.

CVE matching, latest versions, release notes, and EOL are part of the same scan. Dashboard counts come from the latest inventory (updates available, security updates, high priority, review, low risk). Inventory, updates, findings, and scan history are opened from a **project**. Company-wide lists still exist at `/inventory`, `/updates`, and `/scans` but are not in the sidebar. Project tabs are **Overview**, **Inventory**, and **Scans**. Updates, what changed, and findings for a package live on `/projects/:id/inventory/:name`.

Scheduled re-scans, What’s changed, and finding status are covered in [Scheduled monitoring](/documentation/monitoring).
