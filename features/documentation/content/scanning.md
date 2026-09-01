---
title: Scanning & inventory
description: Reads a GitHub repository or uploaded files, parses dependency files and version catalogs, then enriches components with latest versions, release notes, CVEs, and EOL.
lastUpdated: 2026-09-01
related:
  - href: /documentation/intelligence
    title: Findings & intelligence
    description: OSV, latest versions, release notes, EOL, and recommendations.
  - href: /documentation/architecture/tenancy
    title: Self-host architecture
    description: Session cookies — no user tables.
  - href: /documentation/onboarding
    title: Scan flow
    description: Connect GitHub or upload a file.
---

**Scan** on `/scan` reads GitHub or an uploaded file on the server, lists open-source components, then checks external intelligence. Connecting GitHub does not start a scan by itself.

After GitHub is connected, check the repositories to scan, then choose **entire repository** (known manifests) or **specific files**. A full scan can include more than one repository (merged into one report, up to 8). Specific files require a single repository.

Report (`/inventory`) is **discovery** (what you use). Open a package at `/inventory/:name` for current → new, what changed, security, and a recommendation.

```text
/scan
  → GitHub (check repos, then full vs specific files) or SBOM JSON or manifests
  → POST /api/session/scan
  → Read GitHub tree **or** chosen paths **or** parse uploaded files
  → Parse dependency files and version catalogs
  → Latest version / GitHub releases / OSV / EOL / impact / P1–P4
  → Return JSON (not written to Postgres)
  → Dashboard / Report in this browser tab
```

## Scan inputs

| Input | What is read |
| --- | --- |
| GitHub repository | Known manifests (package.json, lockfiles, bom.yaml, and the rest of the list below), up to 80 files, or only the paths you pick. Multiple repositories are merged into one report. |
| CycloneDX / SPDX JSON | Packages in the SBOM. |
| Manifests | Up to 40 uploaded files (`package.json`, lockfiles, `bom.yaml`, …). |

## Supported files

`package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `requirements.txt`, `Pipfile`, `poetry.lock`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Cargo.lock`, `Gemfile`, `Gemfile.lock`, `composer.json`, `composer.lock`, `pom.xml`, `build.gradle`, `Dockerfile`, `docker-compose.yml`, `bom.yaml`, `bom.yml`, `versions.yaml`, `versions.yml`, `tools.yaml`, `tools.yml`.

Lockfile versions win over range specifiers in manifests. Version catalogs pin infrastructure the same way a pin like `runc: version: "1.4.2"` works in `bom.yaml` or `versions.yaml`. Nested `components:` maps (Helm charts, operators) are included.

Default Report is **not** a node_modules dump. It shows **infra pins + declared dependencies**. Transitive lockfile packages stay hidden unless they have a CVE. Updates groups those routine transitive bumps by parent.

A scan reads at most 80 manifest files per repository (catalogs and declared manifests first, then lockfiles). Intelligence (latest version, OSV, EOL) runs on at most 400 unique packages, **infra and direct first**. GitHub release notes run on at most 40 outdated packages. See [Findings & intelligence](/documentation/intelligence).

## APIs

| Request | Result |
| --- | --- |
| `GET /api/session/github` | Whether GitHub is connected for this session, plus repositories |
| `POST /api/session/github` | `{ token }` — store a PAT in the session cookie |
| `DELETE /api/session/github` | Drop the GitHub cookie |
| `GET /api/session/github/files` | Search blob paths in a connected repository (`fullName`, `branch`, `q`) |
| `POST /api/session/scan` | `{ source: "github", repositories, scanMode?, files? }` or `{ source: "sbom", document }` or `{ source: "files", files: [{ path, content }] }` |

GitHub tokens never leave the server in JSON. The report is returned once; the UI keeps it in `sessionStorage`.
