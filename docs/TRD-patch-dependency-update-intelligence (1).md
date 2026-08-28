# TRD — Patch / Dependency Update Intelligence

**Version:** 1.0
**Status:** Draft for engineering review
**Delivery model:** 3 phases (Phase 1 = MVP, Phase 2 = Intelligence & Automation of Monitoring, Phase 3 = Remediation & Enterprise)

---

## 1. Product Overview

**Product name:** Patch / Dependency Update Intelligence

This product is **not** a package manager, package cache, or package registry.

It is a platform that:

1. Discovers the open-source components a company actually uses (from repos, manifests, Dockerfiles, SBOMs).
2. Continuously monitors upstream projects for new releases.
3. Explains **what changed** between the customer's current version and the new version.
4. Determines **security relevance** (CVEs, advisories) and **breaking changes**.
5. Assesses **impact** on the customer's applications and environments.
6. Produces a clear **recommendation**: UPDATE / UPDATE URGENTLY / REVIEW / WAIT.

**Core product statement:**

> "We don't just tell companies that a new open-source version exists. We tell them what changed, whether they are affected, and whether they should update."

**Reference example (must work end-to-end):**

- Customer's Dockerfile / values file contains: `runc: 1.4.2`
- Upstream releases `runc 1.4.3`
- Platform detects the release, retrieves the changelog/release notes/advisories, and shows:
  - Release type: Patch
  - 2 security fixes (with CVE IDs), 4 bug fixes
  - Breaking changes: none
  - Used by: Payment Service, Worker Service (Production)
  - Impact: High
  - Recommendation: 🔴 UPDATE (security fixes, no breaking changes, production usage)

---

## 2. Problem Statement

Companies use hundreds/thousands of open-source components. When upstream releases a new version:

- They may not notice the release at all.
- If they notice, they don't know what changed.
- They don't know if the change is a security fix, bug fix, or breaking change.
- They don't know which of their applications are affected.
- They can't prioritize: which of 200 available updates matter this week?

Existing tools (Dependabot-style scanners, generic inventory dashboards) answer only *"a newer version exists."* They do not answer *"what changed, does it affect us, and how urgent is it?"*

---

## 3. Goals & Non-Goals

### Goals
- G1: Accurate dependency inventory from customer sources.
- G2: Reliable detection of new upstream releases within 24 hours (Phase 1: on-demand scan; Phase 2: automatic).
- G3: Human-readable "What's Changed" for every current → new version pair.
- G4: Security advisory / CVE correlation for every update.
- G5: Deterministic, explainable recommendations.
- G6: Impact mapping: dependency → application → environment (Phase 2).
- G7: Optional automated remediation (PR creation) (Phase 3).

### Non-Goals
- NG1: Installing, resolving, hosting, caching, or publishing packages.
- NG2: Replacing CI/CD or acting as a build tool.
- NG3: Auto-updating dependencies without human approval (never in Phase 1–2; opt-in in Phase 3).
- NG4: Full SAST/DAST scanning — this is not a code scanner.

---

## 4. Personas & Use Cases

| Persona | Need |
|---|---|
| DevOps / Platform Engineer | "runc has a new version — do I need to patch my container hosts?" |
| Application Developer | "React 19.2.5 is out — is it safe to bump?" |
| Security Engineer | "Which of our production dependencies have unpatched CVEs?" |
| Engineering Manager / CISO | "What is our overall patch posture? What's overdue?" |

**Primary use cases:**
1. UC-1: Connect a repo → see inventory of open-source components with current vs latest versions.
2. UC-2: Open an available update → see what changed, security info, breaking changes, recommendation.
3. UC-3: See prioritized list of updates (security first).
4. UC-4 (P2): See which applications/environments an update affects.
5. UC-5 (P2): Get notified automatically when a relevant release ships.
6. UC-6 (P3): One-click "Create update PR" with the change summary in the PR body.

---

## 5. End-to-End User Journey

```
Sign up / Log in
      ↓
Create Organization → Create Project
      ↓
Connect source: Git repo / dependency file upload / SBOM
      ↓
First scan runs → Dependency discovery
      ↓
Overview dashboard:
   Updates Available | Security Updates | High Priority | Components
      ↓
Inventory: everything we use, current vs latest
      ↓
Updates: prioritized list of available updates
      ↓
Click an update → What's Changed screen:
   Current → New | Release type | Changes | CVEs | Breaking changes
   | Usage | Impact | Recommendation
      ↓
User decides: update / review / wait
      ↓
(P2) Automatic monitoring + Slack/email alerts
(P3) Create PR from the platform
```

---

## 6. System Architecture (High Level)

```
                        ┌────────────────────────┐
                        │        Frontend        │
                        │  (SPA: dashboard, UI)  │
                        └───────────┬────────────┘
                                    │ HTTPS + JWT
                        ┌───────────▼────────────┐
                        │       API Gateway /     │
                        │       Backend API       │
                        └───────────┬────────────┘
              ┌─────────────────────┼──────────────────────┐
              ▼                     ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐
   │ Discovery Service │  │ Monitoring Svc   │  │ Intelligence Svc   │
   │ (parse manifests, │  │ (registry/GitHub │  │ (changelog parse,  │
   │  Dockerfiles,     │  │  release polling)│  │  CVE correlation,  │
   │  SBOMs)           │  │                  │  │  diff, scoring,    │
   └────────┬─────────┘  └────────┬─────────┘  │  recommendation)   │
            │                     │            └─────────┬──────────┘
            └──────────┬──────────┴──────────────────────┘
                       ▼
             ┌──────────────────┐        ┌──────────────────────┐
             │   PostgreSQL     │        │  Job Queue / Workers │
             │ (multi-tenant)   │        │  (scans, polling,    │
             └──────────────────┘        │   notifications)     │
                                         └──────────────────────┘
External sources: package registries (npm, PyPI, Go proxy, crates.io,
Maven Central, Docker Hub/GHCR), GitHub Releases/Tags/CHANGELOG,
OSV / GitHub Security Advisories / NVD.
```

**Key principles:**
- Multi-tenant from day one (org-scoped data, row-level isolation).
- All upstream lookups cached/normalized centrally (a release analyzed once serves all tenants).
- Workers do all heavy lifting; API stays fast.

---

## 7. Phased Delivery Plan (Summary)

| Phase | Theme | Outcome |
|---|---|---|
| **Phase 1 (MVP)** | Discover → Compare → Understand → Recommend | Connect a repo, scan on demand, inventory, updates list, What's Changed screen, CVE check, deterministic recommendation |
| **Phase 2** | Continuous Intelligence | Automatic monitoring, notifications, impact analysis (app/env mapping), more input sources (SBOM, Dockerfile, OS packages), history & trends |
| **Phase 3** | Remediation & Enterprise | PR creation, policy engine, approval workflows, AI change summaries, advanced risk scoring, SSO/audit for enterprise |

---

# PHASE 1 — MVP: "Detect → Understand → Recommend"

## 8. Phase 1 Scope

### 8.1 Source Connection
- Connect **Git repository** (GitHub first; GitLab/Bitbucket P2).
  - OAuth app or PAT with **read-only** scope.
  - Tokens encrypted at rest (KMS/DB-level encryption); never returned to frontend.
- Manual **file upload** fallback: `package.json`, lockfiles, `requirements.txt`.

### 8.2 Dependency Discovery
Supported manifests in Phase 1:
- `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` (npm ecosystem)
- `requirements.txt`, `poetry.lock` (PyPI)
- `go.mod` (Go)
- `Dockerfile` — image tags + explicitly pinned components *(minimum: image base versions; deep OS package scan is Phase 2)*
- **Custom version manifest (YAML) — Phase 1 REQUIRED.** Infrastructure components pinned in a project versions file. Reference format:

```yaml
runc:
  version: "1.4.2"
  docs: "https://github.com/opencontainers/runc/releases"
  url: "https://github.com/opencontainers/runc/releases/download/v1.4.2/runc.{{ .Arch }}"
  sha256:
    amd64: ""
    arm64: ""
crictl:
  version: "1.35.0"
  docs: "https://github.com/kubernetes-sigs/cri-tools/releases"
cni_plugins:
  version: "1.9.1"
  docs: "https://github.com/containernetworking/plugins/releases"
```

**Parsing rules for custom manifests:**
1. Any top-level YAML key containing a `version` field is treated as a component.
2. `docs` / `url` fields are parsed to extract the upstream GitHub repo (`owner/repo`) — this becomes the component's **release feed** automatically (no curated mapping needed when the file provides it).
3. If no GitHub URL is derivable, fall back to the curated mapping table (Section 14).
4. Ecosystem is recorded as `infra/github-release`; monitoring uses **GitHub Releases/Tags**, not a package registry.
5. Template placeholders (`{{ .Arch }}`, `{{ .OS }}`) are ignored for identification purposes.
6. The user can register which file(s) in the repo are version manifests (path pattern config, e.g. `versions.yaml`, `components/*.yaml`); the scanner also auto-detects files matching the shape above.

This is the primary product use case: `runc 1.4.2` pinned here + upstream releases `1.4.3` ⇒ platform detects it, shows what changed, CVEs, and a recommendation — even though runc exists in **no package registry**.

Output: normalized dependency records — `(ecosystem, name, current_version, source_file, direct|transitive, upstream_repo_url)`.

### 8.3 Version Monitoring (on-demand in Phase 1)
- On **Start Scan**: for every discovered dependency, query the registry for the latest stable version.
  - npm registry, PyPI JSON API, Go module proxy, GitHub tags/releases for non-registry components (e.g., runc).
- Compute semver comparison: `patch | minor | major | unknown`.

### 8.4 What's Changed Engine (core of the product)
For each `current → latest` pair:
1. Resolve the upstream source repo (registry metadata → GitHub URL).
2. Fetch **GitHub Releases** between the two versions; fall back to `CHANGELOG.md` diff; fall back to tag-to-tag commit list.
3. Classify each change line/entry: `security | bugfix | feature | performance | breaking | other` (keyword + label heuristics in Phase 1; AI summarization in Phase 3).
4. Store a normalized change set per (dependency, from_version, to_version).

**Displayed as:**
```
runc  1.4.2 → 1.4.3
Release type: Patch      Released: 2026-08-26
Security:   🔴 2 security fixes (CVE-…, CVE-…)
Bug fixes:  ✓ 4
Breaking:   None identified
Source: GitHub release notes [link]
```
If no changelog data can be retrieved, show "Change details unavailable — view upstream release" with the link. Never fabricate changes.

### 8.5 Security / CVE Intelligence
- Query **OSV.dev** and **GitHub Security Advisories** for:
  - Vulnerabilities in the **current** version (⇒ urgency driver).
  - Vulnerabilities **fixed** by the new version.
- Store: CVE/GHSA ID, severity (CVSS), affected ranges, fixed version.

### 8.6 Recommendation Engine (deterministic rules — Phase 1)

| Condition | Recommendation |
|---|---|
| Current version has known CVE, fix available | 🔴 **UPDATE URGENTLY** |
| New release contains security fixes, no breaking changes | 🔴 **UPDATE** |
| Patch/minor update, no breaking changes | ✅ **UPDATE** |
| Major version OR breaking changes detected | ⚠ **REVIEW** |
| New version, no meaningful changes detected | ⏸ **OPTIONAL / WAIT** |

Every recommendation must show its **reasons** (explainability requirement).

### 8.6b Noise Management — Direct vs Transitive vs Infra (CRITICAL for Node projects)

A typical Node project has **100–5,000 packages** in its lockfile, but only **20–80 direct dependencies** in `package.json`. Showing all 5,000 as equal rows (as in the current Inventory screenshot, where dozens of `@babel/helper-*` transitives dominate the table) makes the product unusable. The platform must separate **signal from noise**.

**Dependency tiers (every dependency is classified into exactly one):**

| Tier | Definition | Source | Default visibility |
|---|---|---|---|
| **T1 — Infra components** | runc, crictl, cni_plugins, OS/container components | custom version manifest, Dockerfile | Always shown, always analyzed in depth |
| **T2 — Direct dependencies** | Listed in `package.json` `dependencies`/`devDependencies` (react, next, express…) | package.json | Always shown |
| **T3 — Transitive dependencies** | Pulled in by T2 (e.g. `@babel/helper-*` via a build tool) | lockfile only | Hidden by default; shown only when **security-relevant** or on filter toggle |

**Rules:**

1. **Inventory default view** = T1 + T2 only, with a count chip: *"+ 4,213 transitive dependencies (12 with security advisories) — Show"*.
2. **A transitive dependency (T3) is promoted into the default views only if:**
   - its **current** version has a known CVE/advisory, or
   - the available update contains a **security fix**, or
   - the user explicitly pins/watches it.
3. **Updates screen** never lists routine transitive version bumps individually. Non-security transitive updates are **grouped by their direct parent**: *"@babel/core 7.29.7 → 8.0.1 (brings 27 transitive updates)"* — expandable, not 27 separate rows.
4. **Findings screen** shows all tiers (security is security, regardless of tier), but labels the tier and shows the **dependency path** for transitives: `next → @babel/core → @babel/helper-globals`.
5. **What's Changed depth by tier:** T1 and T2 get full change intelligence (release notes, CVEs, breaking changes, recommendation). T3 gets security-only analysis by default; full analysis on demand.
6. **Overview counters** count actionable items, not raw packages: "12 Updates Available" means 12 things a human should look at — not 400 transitive bumps.
7. Filters available everywhere: Tier (Infra / Direct / Transitive), Security only, Update type, Source file.

**Product rule:** *runc in the version manifest and react in package.json are first-class citizens. `@babel/helper-annotate-as-pure` is background noise unless it has a CVE.*

**Acceptance addition:** a repo with 3,000 lockfile packages must render an Inventory default view of ≤ ~100 rows (T1 + T2 + promoted security T3), with the rest reachable behind the transitive toggle.



Navigation: **Overview · Inventory · Updates · What's Changed (detail) · Findings · Scans**

1. **Overview** — cards: Updates Available, Security Updates, High Priority, Total Components; "Recent Updates" list.
2. **Inventory** — table: Component | Current | Latest | Update Type | Source file | Recommendation badge. Row click → detail.
3. **Updates** — only components with available updates, sorted: security → major → minor → patch.
4. **What's Changed (detail page)** — the flagship screen (Section 8.4 + 8.5 + recommendation with reasons).
5. **Findings** — security-only view: CVEs affecting current versions.
6. **Scans** — scan history: started, finished, status, dependency count, new findings.

### 8.8 Scan Behaviour (Start Scan)
```
Read source → Parse manifests → Normalize dependencies
→ Fetch latest versions → Detect updates → Fetch changelogs/releases
→ Fetch advisories → Classify changes → Generate recommendations
→ Persist scan_result → Update dashboard
```
Scans run async on workers; UI shows progress states (Queued → Discovering → Analyzing → Complete/Failed).

### 8.9 Phase 1 Acceptance Criteria
- AC-1: Connecting a GitHub repo with a `package.json` produces a complete inventory in ≤ 5 min for ≤ 500 deps.
- AC-2: The runc-style flow works end-to-end: a component pinned in a **custom version manifest YAML** (e.g. `runc: version "1.4.2"` with a GitHub `docs`/`url` field) is discovered as an `infra/github-release` dependency; the latest GitHub release (`1.4.3`) is detected; release notes, change classification, and CVEs are shown; a recommendation with reasons is generated. Same must work for `crictl` and `cni_plugins` entries in the same file.
- AC-3: Every update row can be opened to a What's Changed page with at least: version pair, release type, change summary or upstream link, security status, recommendation + reasons.
- AC-4: No credentials ever appear in API responses or logs.
- AC-5: A dependency with a CVE in its **current** version appears in Findings with severity and fixed-version guidance.
- AC-6: Recommendations are reproducible (same inputs ⇒ same output).
- AC-7 (Phase 1): For a Node repo with ≥ 1,000 lockfile packages, the default Inventory and Updates views show only Tier 1 (infra) + Tier 2 (direct) + security-promoted Tier 3 items; transitive noise is grouped/hidden per Section 8.6b. A transitive package with a CVE in its current version still surfaces in Findings with its dependency path.

---

# PHASE 2 — Continuous Intelligence: "Monitor → Map → Notify"

## 9. Phase 2 Scope

### 9.1 Automatic Monitoring
- Scheduler (cron/queue): re-check upstream releases **daily** (configurable per org).
- New release detected ⇒ analysis pipeline runs automatically ⇒ finding created ⇒ notification sent.
- Optional GitHub webhooks for near-real-time repo changes (re-discover on manifest change).

### 9.2 Impact Analysis & Application Mapping
Data model addition: `applications`, `environments`, `dependency_usages`.

```
Impact = where used (apps) + environment (prod/non-prod)
       + security fix in new release
       + breaking change flag
⇒ Impact level: Low | Medium | High | Critical
```

**Impact screen per update:**
```
runc 1.4.3
Used by: Payment Service, Checkout Service, Worker Service
Environment: Production
Impact: HIGH — production container infrastructure
Recommendation: 🔴 Update within 7 days
```

Mapping sources: repo→app mapping configured by user; auto-suggested from repo structure.

### 9.3 Expanded Input Sources
- GitLab & Bitbucket connections.
- **SBOM ingestion**: CycloneDX & SPDX (JSON).
- Maven (`pom.xml`), Gradle, `Cargo.toml`, `Gemfile.lock`, `composer.lock`.
- Container image scanning: extract OS packages (apk/deb/rpm) and runtime components (runc, containerd) from images.

### 9.4 Notifications & Alerts
- Channels: Email + Slack webhook (org-configurable).
- Triggers: new security update, new critical finding, scan failure.
- Digest mode: daily/weekly summary.
- Alert content = the What's Changed summary + recommendation + deep link.

### 9.5 History & Trends
- Update history per dependency (when detected, when resolved).
- Org-level trend: open updates over time, mean-time-to-patch, security backlog.
- "Resolved" detection: next scan sees current version ≥ recommended version ⇒ auto-close finding.

### 9.6 Priority / Risk Scoring v1
```
score = severity_weight(CVSS)
      + production_usage_bonus
      + breaking_change_penalty(for auto-update safety)
      + age_of_available_fix
⇒ Priority: P1..P4 shown on Updates screen
```
Formula must be documented and shown in tooltip ("Why is this P1?").

### 9.7 Phase 2 Acceptance Criteria
- AC-8: A new upstream release is reflected in the customer dashboard within 24h without any manual scan.
- AC-9: Slack/email alert fires for a security release with correct summary + link.
- AC-10: An update shows which applications and environments are affected.
- AC-11: SBOM (CycloneDX JSON) upload produces the same quality inventory as a repo connection.
- AC-12: Findings auto-close when the customer's version is updated.

---

# PHASE 3 — Remediation & Enterprise: "Act → Govern"

## 10. Phase 3 Scope

### 10.1 Automated PR Creation (opt-in)
- "Create update PR" button on the What's Changed screen.
- Platform opens a branch, bumps the manifest/lockfile, and opens a PR whose description contains the change summary, CVEs fixed, breaking-change notes, and recommendation.
- Requires elevated (write) repo scope — separate, explicit consent flow; scope shown to the user.
- Never auto-merge. Optional: auto-create PRs for security patches only (policy-driven).

### 10.2 Policy Engine
Org-defined rules, e.g.:
```
IF security_fix AND environment = production  ⇒ SLA 7 days, notify #sec-ops
IF major_version                              ⇒ require manual review
IF license changed                            ⇒ flag to legal
```
Policies evaluated on every new finding; violations surface on Overview.

### 10.3 AI-Generated Change Summaries
- LLM summarization of long changelogs/commit ranges into the normalized change categories.
- Guardrails: summaries always link to raw upstream sources; label AI-generated content; never invent CVEs — CVE data comes only from advisory databases.

### 10.4 Enterprise & Governance
- SSO (SAML/OIDC), SCIM provisioning.
- RBAC: Owner / Admin / Member / Viewer; per-project permissions.
- Approval workflows: update proposals require sign-off before PR creation.
- Full **audit log**: who connected what, who triggered scans, who approved updates.
- Data retention & deletion controls (delete org ⇒ purge repo data & credentials).

### 10.5 Advanced Risk Scoring v2
- Reachability signals (is the vulnerable function actually imported/used) — best effort.
- Exploit-availability feeds (KEV, EPSS) to boost urgency.

### 10.6 Phase 3 Acceptance Criteria
- AC-13: "Create PR" produces a mergeable PR with correct version bump and a change summary in the body.
- AC-14: A policy rule ("security fixes in prod ⇒ 7-day SLA") creates an SLA timer and alerting.
- AC-15: All privileged actions appear in the audit log with actor, timestamp, and object.
- AC-16: AI summaries always carry a source link and an "AI-generated" label.

---

## 11. Data Model (Target Schema — built incrementally)

```
organizations(id, name, plan, created_at)
users(id, org_id, email, role, sso_subject)
projects(id, org_id, name)
repositories(id, project_id, provider, url, default_branch, credential_id)
credentials(id, org_id, provider, encrypted_token, scopes, created_by)   -- encrypted at rest
applications(id, project_id, name, environment)                          -- P2
dependencies(id, ecosystem, name, upstream_repo_url)                     -- global, shared
dependency_usages(id, repository_id, dependency_id, current_version,
                  source_file, tier[infra|direct|transitive],
                  direct_parent_id, application_id)                       -- app link P2
releases(id, dependency_id, version, released_at, release_type, url)     -- global, shared
release_changes(id, release_id, category, summary, source)               -- security|bugfix|feature|breaking|perf|other
security_advisories(id, dependency_id, cve_id, ghsa_id, severity, cvss,
                    affected_range, fixed_version, source)
findings(id, org_id, dependency_usage_id, type, from_version, to_version,
         status[open|resolved|dismissed], priority, created_at, resolved_at)
recommendations(id, finding_id, action[update|update_urgent|review|wait],
                reasons[jsonb], score)
impact_assessments(id, finding_id, level, factors[jsonb])                -- P2
scans(id, repository_id, status, started_at, finished_at, stats[jsonb])
notifications(id, org_id, channel, payload, sent_at)                     -- P2
policies(id, org_id, rule[jsonb], enabled)                               -- P3
remediations(id, finding_id, pr_url, status)                             -- P3
audit_logs(id, org_id, actor_id, action, object_type, object_id, at)     -- P3 (basic from P1)
```

**Tenant isolation:** every customer-scoped table carries `org_id`; enforced at query layer (and/or RLS).
**Shared intelligence:** `dependencies`, `releases`, `release_changes`, `security_advisories` are global — analyzed once, served to all tenants.

---

## 12. Backend API (Representative Contracts)

All endpoints: `Authorization: Bearer <JWT>`, org-scoped.

```
POST   /api/v1/repositories                      # connect repo {provider, url, token}
POST   /api/v1/repositories/{id}/scans           # start scan
GET    /api/v1/scans/{id}                        # scan status/progress
GET    /api/v1/inventory?project_id=…            # inventory table
GET    /api/v1/updates?priority=…&security=true  # updates list
GET    /api/v1/updates/{finding_id}              # What's Changed payload:
        { dependency, current, latest, release_type, released_at,
          changes:[{category, summary, source_url}],
          advisories:[{cve, severity, fixed_in}],
          breaking: bool|unknown,
          usage:[{app, environment}],             # P2
          impact:{level, factors},                # P2
          recommendation:{action, reasons[]} }
GET    /api/v1/findings?status=open&type=security
POST   /api/v1/findings/{id}/dismiss             # with reason
POST   /api/v1/findings/{id}/remediate           # P3: create PR
GET    /api/v1/overview                           # dashboard counters
POST   /api/v1/notifications/settings             # P2
```

Errors: RFC-7807 problem+json; 429 with Retry-After on upstream rate limiting.

---

## 13. Background Jobs / Schedulers

| Job | Phase | Schedule |
|---|---|---|
| `scan.run` (full pipeline for a repo) | P1 | on demand |
| `registry.poll_latest` (per dependency) | P2 | daily, jittered |
| `advisories.sync` (OSV/GHSA/NVD delta) | P1 (on scan) / P2 (scheduled) | 6-hourly (P2) |
| `changelog.fetch_and_classify` | P1 | on new release |
| `notify.dispatch` | P2 | event-driven |
| `findings.autoresolve` | P2 | after each scan |
| `policy.evaluate` | P3 | on new finding |

Workers must respect upstream rate limits (GitHub token pooling, ETag caching, backoff).

---

## 14. External Data Sources

| Data | Source |
|---|---|
| Latest versions | npm registry, PyPI, Go proxy, crates.io, Maven Central, RubyGems, Packagist, Docker Hub/GHCR, GitHub tags |
| Release notes / changes | GitHub Releases, CHANGELOG files, commit ranges |
| Security | OSV.dev (primary), GitHub Security Advisories, NVD; KEV/EPSS in P3 |
| Component→repo resolution | Registry metadata (`repository` field), curated mapping table for infra components (runc, containerd, openssl…) |

**Note:** infra components like `runc` are not in npm/PyPI — the curated mapping table (name → GitHub repo → release feed) is a **Phase 1 requirement**, since runc is the reference use case.

---

## 15. Security Requirements (all phases)

- Read-only repo scopes by default; write scope only for P3 PR feature, separately consented.
- Credentials/tokens encrypted at rest (envelope encryption); never logged, never sent to frontend.
- TLS everywhere; JWT auth with short-lived access tokens.
- Strict tenant isolation (org_id enforced on every query; tested).
- Webhook signature verification (GitHub HMAC).
- Secrets never included in scan artifacts; repo file contents beyond manifests are not persisted.
- Right-to-delete: org deletion purges all repo-derived data and credentials.
- Basic audit trail from Phase 1 (connect, scan, dismiss), full audit in Phase 3.

---

## 16. Performance & Scalability Targets

- Scan of 500-dependency repo: ≤ 5 min (P1), ≤ 2 min warm-cache (P2).
- Shared release/advisory cache hit rate > 90% after warm-up.
- API p95 < 300 ms for list endpoints.
- Daily polling scales linearly with **unique dependencies**, not tenants (dedup by design).

---

## 17. Observability

- Structured logs (no secrets), request IDs.
- Metrics: scans/day, scan duration, upstream API error rate, release-detection lag, notification delivery.
- Alerting on: scan failure rate > 5%, advisory sync stale > 24h, upstream rate-limit exhaustion.

---

## 18. Product Language (must be enforced in UI copy)

| Don't use | Use |
|---|---|
| Package Management / Package Manager | Patch / Dependency Update Intelligence |
| Package list | Dependency Inventory |
| New version available | Update available + What's Changed |
| — | Impact, Recommendation, Security Updates |

Login/onboarding copy: *"Welcome to Patch / Dependency Update Intelligence — Connect your codebase (Git Repository · SBOM · Dependency Files)"* → scan → land on Overview.

---

## 19. Success Criteria (Product-level)

The product is **not** done if it only answers *"which packages have newer versions?"*

It is done when it answers, for the runc example and the package.json example alike:

> "You are using 1.4.2. 1.4.3 was released on [date]. It contains 2 security fixes (CVE-…), 4 bug fixes, and no breaking changes. It is used by your Payment Service in production. Impact: High. Recommendation: Update within 7 days."

Core loop: **Discover → Monitor → Compare → Understand → Assess → Recommend → (Act)**

---

## 20. Out of Scope / Future Enhancements (post-Phase 3)

- License compliance intelligence
- Auto-merge with test-gating
- Runtime/agent-based inventory
- Marketplace of curated upgrade guides
- Cross-org anonymized "who has updated already" adoption signals
