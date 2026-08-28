Absolutely. Below is the **final end-to-end TRD for SecureStack**, updated around your decisions:

* Product name: **SecureStack**
* UI says **Company**, never Tenant
* **Supabase Auth + Supabase PostgreSQL**
* Keep the initial DB to **5 tables**
* Existing **Vercel/Design system boilerplate** is reused
* Start with **dummy data** for UI
* **GitHub connection is real from the beginning**
* Support **multiple projects**
* Projects can support **multiple Git repositories**
* Build in **4 implementation phases**
* Every phase has an **end-to-end test**
* Don't build the full vulnerability database; fetch intelligence from external sources
* No automatic patching in MVP

# SecureStack — End-to-End Technical Requirements Document

**Version:** 1.0
**Date:** August 2026
**Status:** Development TRD
**Product:** SecureStack

---

# 1. Product Vision

SecureStack is an **Open-Source Patch & Lifecycle Management Platform** that helps companies understand the open-source software used in their applications and identify what needs to be updated.

A company connects its GitHub repositories to SecureStack.

SecureStack discovers the open-source dependencies and provides:

* Current version
* Latest version
* Available updates
* Security vulnerabilities
* CVEs
* Severity
* Fixed versions
* EOL/lifecycle status
* Release information
* What's changed
* Breaking changes
* Upgrade recommendation
* Risk
* Findings

The core product promise is:

> **Connect your code and SecureStack tells you what open-source software you're using, what is outdated, what is vulnerable, what changed, and what you should fix first.**

---

# 2. Product Terminology

SecureStack should use simple customer-facing terminology.

| Term           | Meaning                               |
| -------------- | ------------------------------------- |
| Company        | Customer organization                 |
| User           | Person using SecureStack              |
| Project        | Application/product being monitored   |
| Repository     | Git repository connected to a project |
| Component      | Open-source dependency                |
| Scan           | Analysis of a repository              |
| Finding        | Actionable issue                      |
| Update         | Newer component version               |
| Security Issue | Vulnerability affecting a component   |

### Never use "Tenant" in the product UI.

Database relationships use:

```text
company_id
```

not:

```text
tenant_id
```

---

# 3. Target User

Initial users:

### Engineering

Wants to know:

* What dependencies are being used?
* Which ones need upgrades?
* Will an upgrade introduce breaking changes?

### Security

Wants to know:

* Which components have CVEs?
* Which vulnerabilities are critical?
* Which applications are affected?

### Engineering Manager / CTO

Wants to know:

* Overall open-source health
* Number of outdated components
* Security exposure
* EOL exposure
* Highest-priority actions

---

# 4. High-Level Product Flow

```text
                    SECURESTACK
                         │
                         ▼
                    SIGN UP
                         │
                         ▼
                  COMPANY SETUP
                         │
                         ▼
                     LOGIN
                         │
                         ▼
                    DASHBOARD
                         │
                         ▼
                  + ADD PROJECT
                         │
                         ▼
                  PROJECT NAME
                         │
                         ▼
                  CONNECT GITHUB
                         │
                         ▼
              SELECT REPOSITORY
                         │
                         ▼
                  PROJECT CREATED
                         │
                         ▼
                   START SCAN
                         │
                         ▼
              READ REPOSITORY
                         │
                         ▼
            DETECT DEPENDENCIES
                         │
                         ▼
             DETECT VERSIONS
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           GitHub       OSV        NVD
           Releases    Security   Security
              │          │          │
              └──────────┼──────────┘
                         ▼
               INTELLIGENCE ENGINE
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Updates    Security      EOL
              │          │          │
              └──────────┼──────────┘
                         ▼
                 CHANGE ANALYSIS
                         │
                         ▼
                    RISK ENGINE
                         │
                         ▼
                 FINDING ENGINE
                         │
                         ▼
                    DASHBOARD
                         │
                         ▼
                     ALERT
```

---

# 5. Technology Architecture

Because the frontend boilerplate already exists, it should be reused.

```text
Frontend
────────────
Next.js
React
TypeScript
Existing Vercel-style Design System


Backend
────────────
Next.js Server/API
or Node.js service


Authentication
────────────
Supabase Auth


Database
────────────
Supabase PostgreSQL


Authorization
────────────
PostgreSQL RLS


Background Processing
────────────
Worker / Queue


External Sources
────────────
GitHub
OSV
NVD
Package Registries
```

---

# 6. Database Architecture

The initial application database contains **5 tables**.

```text
companies
users
projects
scans
findings
```

Supabase Auth's own `auth.users` remains separate from our five application tables.

---

# 7. Database Relationship

```text
                     companies
                         │
               ┌─────────┴─────────┐
               ▼                   ▼
             users              projects
                                   │
                              ┌────┴────┐
                              ▼         ▼
                            scans    findings
```

---

# 8. Table — companies

```text
companies
-------------------------
id
name
slug
status
created_at
updated_at
```

Example:

```text
id: cmp_123
name: Acme Technologies
status: active
```

---

# 9. Table — users

```text
users
-------------------------
id
company_id
name
email
role
created_at
updated_at
```

Relationship:

```text
users.id
    ↓
auth.users.id
```

Supabase Auth manages authentication.

SecureStack's `users` table manages application-specific information.

---

# 10. Table — projects

```text
projects
-------------------------
id
company_id
name
description
repositories
status
created_at
updated_at
```

`repositories` is initially JSON/JSONB.

Example:

```json
[
  {
    "provider": "github",
    "repositoryId": "12345",
    "url": "https://github.com/company/payment-api",
    "branch": "main"
  }
]
```

This allows:

```text
Company
   │
   ├── Project A
   │     ├── Repository A
   │     └── Repository B
   │
   ├── Project B
   │     └── Repository C
   │
   └── Project C
         └── Repository D
```

If repository-level management becomes complex later, we can introduce a separate repository table.

---

# 11. Table — scans

```text
scans
-------------------------
id
project_id
source
status
started_at
completed_at
components_found
findings_found
result_snapshot
error
created_at
```

`result_snapshot` stores the scan result.

Example:

```json
{
  "components": [
    {
      "name": "react",
      "ecosystem": "npm",
      "version": "18.3.1"
    },
    {
      "name": "axios",
      "ecosystem": "npm",
      "version": "1.7.9"
    }
  ]
}
```

---

# 12. Table — findings

```text
findings
-------------------------
id
project_id
component_name
ecosystem
current_version
recommended_version
finding_type
severity
external_reference
status
recommendation
first_detected_at
last_detected_at
resolved_at
created_at
updated_at
```

Example:

```text
Component:
Axios

Current:
1.7.9

Recommended:
1.8.2

Finding:
Security

Severity:
HIGH

Status:
OPEN
```

---

# 13. What SecureStack Stores

SecureStack stores **customer-specific data**:

```text
Company
Users
Projects
Repositories
Scan history
Scan results
Findings
Finding status
Recommendations
```

---

# 14. What SecureStack Does NOT Store Initially

Don't create a giant internal database containing every open-source package and every CVE.

Instead, fetch intelligence from external sources.

```text
GitHub
OSV
NVD
Package Registries
```

For example:

```text
Customer:
Axios 1.7.9

       ↓

SecureStack checks:

Latest version
Security advisories
CVE
Fixed version
Release notes

       ↓

SecureStack creates Finding
```

This keeps the database small.

---

# 15. Authentication

Use **Supabase Auth**.

### Signup

```text
User
 ↓
SecureStack Signup
 ↓
Supabase Auth
 ↓
Account Created
 ↓
Company Name
 ↓
Company Created
 ↓
User linked to Company
 ↓
Dashboard
```

The first user becomes:

```text
ADMIN
```

---

# 16. Company Onboarding

After authentication:

```text
Welcome to SecureStack

Company Name

[ Acme Technologies ]

[ Continue ]
```

After completion:

```text
Company created ✓

Welcome to SecureStack
```

Then redirect to:

```text
/dashboard
```

---

# 17. Dashboard

The initial dashboard should use **dummy data**.

This is intentional.

The purpose is to complete and validate the UI before the scanning engine is ready.

Example:

```text
Open Source Health

Components       127
Updates           28
Security Issues   11
Critical           4
EOL                3
```

---

# 18. Dashboard Sections

### Overview

```text
Components
Updates
Security Issues
Critical Issues
EOL
```

### Projects

```text
Payment API
Web Application
Worker
Customer Portal
```

### Security

```text
Critical
High
Medium
Low
```

### Updates

```text
Component
Current Version
Latest Version
Severity
```

### Recent Findings

```text
Axios
HIGH
Update Required
```

### Recent Scans

```text
Payment API
Completed
5 minutes ago
```

---

# 19. Add Project

Main dashboard contains:

```text
+ Add Project
```

Clicking opens:

```text
Create Project

Project Name
[ Payment API ]

Description
[ Optional ]

[ Continue ]
```

---

# 20. Connect GitHub

After project creation:

```text
Connect Repository

[ Connect GitHub ]
```

GitHub authentication starts.

```text
SecureStack
       ↓
GitHub
       ↓
Authorize
       ↓
Repository Access
       ↓
Return to SecureStack
```

---

# 21. Repository Selection

After GitHub authorization:

```text
Select Repository

☐ payment-api
☐ web-app
☐ worker
☐ customer-portal

[ Connect Repository ]
```

The user can select the repository/repositories allowed by the product flow.

---

# 22. Successful Connection

Display:

```text
✓ GitHub Connected

Payment API

Repository:
github.com/acme/payment-api

Branch:
main

[ Start Scan ]
```

For the first connected repository, SecureStack can automatically start the initial scan.

---

# 23. Multiple Projects

A company can have:

```text
Acme Technologies

Projects

Payment API
Web Application
Admin Portal
Worker
Mobile Backend
```

Each project has its own:

```text
Repositories
Scans
Components
Findings
```

---

# 24. Repository Scanner

The scanner initially supports common dependency files.

### JavaScript / TypeScript

```text
package.json
package-lock.json
yarn.lock
pnpm-lock.yaml
```

### Python

```text
requirements.txt
Pipfile
poetry.lock
```

### Java

```text
pom.xml
build.gradle
```

### Go

```text
go.mod
go.sum
```

### Rust

```text
Cargo.toml
Cargo.lock
```

### Containers

```text
Dockerfile
docker-compose.yml
```

Support can be expanded later.

---

# 25. Scan Flow

```text
Start Scan
    ↓
Create Scan Record
    ↓
Read GitHub Repository
    ↓
Find Dependency Files
    ↓
Parse Dependency Files
    ↓
Detect Components
    ↓
Detect Current Versions
    ↓
Normalize Components
    ↓
Check External Intelligence
    ↓
Generate Findings
    ↓
Save Scan
    ↓
Update Dashboard
```

---

# 26. Example

Repository contains:

```json
{
  "dependencies": {
    "react": "18.3.1",
    "axios": "1.7.9",
    "next": "15.4.2"
  }
}
```

SecureStack detects:

```text
React
18.3.1

Axios
1.7.9

Next.js
15.4.2
```

Then checks external intelligence.

---

# 27. Version Intelligence

For each component:

```text
Current Version
       ↓
Latest Version
       ↓
Compare
       ↓
Determine:
```

```text
Up to date
Patch available
Minor update
Major update
Security update
EOL
```

Example:

```text
Axios

Current: 1.7.9
Latest: 1.8.2

Status:
Update Available
```

---

# 28. Security Intelligence

SecureStack checks sources such as:

```text
OSV
NVD
GitHub Security Advisories
```

For each component:

```text
Component
 ↓
Affected version?
 ↓
YES
 ↓
CVE
 ↓
Severity
 ↓
Fixed version
 ↓
Finding
```

---

# 29. Finding

Example:

```text
Axios

Current Version
1.7.9

CVE
CVE-XXXX

Severity
HIGH

Fixed Version
1.8.2

Recommended
Upgrade to 1.8.2

Status
OPEN
```

---

# 30. EOL Intelligence

SecureStack should identify:

```text
Supported
Approaching EOL
EOL
```

Example:

```text
PostgreSQL 14

EOL:
November 2026

Status:
Approaching EOL
```

---

# 31. Change Intelligence

For an update:

```text
Current:
7.2.5

Target:
7.2.9
```

SecureStack should eventually show:

```text
Security Fixes       3
Bug Fixes            12
Features              4
Breaking Changes      0
Deprecations          1
```

---

# 32. Recommendation Engine

SecureStack should give a clear action.

Example:

```text
Recommended Action

Upgrade Axios

Current:
1.7.9

Recommended:
1.8.2

Risk:
HIGH

Security Fix:
Yes

Breaking Changes:
None detected
```

The objective is to avoid simply showing:

> "CVE found."

Instead show:

> **"You are running this version. It is affected. Upgrade to this version."**

---

# 33. Finding Lifecycle

```text
OPEN
 ↓
ACKNOWLEDGED
 ↓
IN_PROGRESS
 ↓
RESOLVED
```

Additional states:

```text
IGNORED
ACCEPTED_RISK
```

---

# 34. Project Detail

Each project should have:

```text
Payment API

Repository
github.com/acme/payment-api

Last Scan
5 minutes ago

Components
127

Security Issues
11

Updates
28
```

Navigation:

```text
Overview
Inventory
Security
Updates
Changes
Scans
```

---

# 35. Component Inventory

Example:

| Component | Current | Latest | Status     | Security |
| --------- | ------: | -----: | ---------- | -------- |
| React     |  18.3.1 | 18.3.1 | Up to date | None     |
| Axios     |   1.7.9 |  1.8.2 | Update     | High     |
| Redis     |   7.2.5 |  7.2.9 | Update     | High     |
| Next.js   |  15.4.2 | 15.5.x | Update     | Medium   |

---

# 36. Component Detail

Example:

```text
Axios

Current Version
1.7.9

Latest Version
1.8.2

Status
Security Update Available
```

Sections:

```text
Overview
Versions
Security
What's Changed
Recommendation
```

---

# 37. GitHub Integration — Initial Requirement

GitHub integration must be **real**, not mocked.

We need to prove:

```text
SecureStack
 ↓
GitHub Authentication
 ↓
Repository Permission
 ↓
Repository List
 ↓
Repository Selection
 ↓
Repository Read
```

The first technical integration milestone is:

> **SecureStack can authenticate with GitHub and successfully read a customer's repository.**

---

# 38. Dummy Data Strategy

Dummy data is allowed for:

```text
Dashboard metrics
Projects
Components
Findings
Security
Updates
EOL
Charts
```

until their real backend services are ready.

But these must be real as early as possible:

```text
Supabase Auth
Company creation
Project creation
GitHub authentication
GitHub repository connection
```

### Principle

> **Mock the intelligence initially, not the integration architecture.**

---

# 39. Phase 1 — Foundation & GitHub

### Goal

Get a user from signup to a connected GitHub project.

### Build

```text
Supabase project
Supabase Auth
Companies
Users
Projects
RLS
Login
Signup
Company onboarding
Dashboard
Add Project
GitHub integration
Repository selection
```

### Dashboard

Use dummy data.

### E2E Test

```text
Signup
 ↓
Create Company
 ↓
Dashboard
 ↓
Add Project
 ↓
Connect GitHub
 ↓
Authorize GitHub
 ↓
Select Repository
 ↓
Project Created
```

### Definition of Done

A real user can create a company and connect a real GitHub repository.

---

# 40. Phase 2 — Real Scanning

### Goal

Read the connected repository and discover open-source dependencies.

### Build

```text
GitHub repository reader
Dependency parser
Version detection
Component normalization
Scan worker
Scan history
Inventory
```

### E2E Test

```text
Project
 ↓
Start Scan
 ↓
GitHub Repository
 ↓
Read dependency files
 ↓
Parse dependencies
 ↓
Detect versions
 ↓
Save Scan
 ↓
Inventory
```

### Definition of Done

SecureStack can connect to a real repository and show its actual dependencies.

---

# 41. Phase 3 — Security & Patch Intelligence

### Goal

Turn dependency inventory into actionable information.

### Build

```text
Latest version detection
Release information
OSV
NVD
Security matching
CVE
Severity
Fixed version
EOL
Findings
Risk
Recommendation
```

### E2E Test

```text
Real Component
 ↓
Current Version
 ↓
External Intelligence
 ↓
Latest Version
 ↓
CVE Check
 ↓
EOL Check
 ↓
Risk
 ↓
Finding
 ↓
Recommendation
 ↓
Dashboard
```

### Definition of Done

SecureStack can tell the user:

> **"This component is outdated, this is the security issue, this is the fixed version, and this is what you should upgrade to."**

---

# 42. Phase 4 — Continuous Intelligence

### Goal

Make SecureStack continuously monitor the customer's open-source footprint.

### Build

```text
Scheduled scanning
Release monitoring
Vulnerability monitoring
What's Changed
Breaking-change detection
Alerts
Finding lifecycle
Retry mechanisms
Caching
Observability
Production hardening
```

### E2E Test

```text
Scheduled Scan
 ↓
New Release/CVE
 ↓
Component affected
 ↓
Finding created
 ↓
Risk calculated
 ↓
Alert generated
 ↓
User reviews
 ↓
User updates component
 ↓
Next scan
 ↓
Finding resolved
```

### Definition of Done

SecureStack continuously monitors connected repositories and updates findings as new releases and vulnerabilities appear.

---

# 43. API Structure

Initial API structure:

```text
/auth
/company
/users
/projects
/github
/scans
/components
/findings
/dashboard
```

Examples:

```text
POST /api/projects
GET  /api/projects

POST /api/github/connect
GET  /api/github/repositories

POST /api/scans
GET  /api/scans/:id

GET /api/projects/:id/components
GET /api/projects/:id/findings
```

---

# 44. Background Processing

Scanning and external intelligence should not block the web request.

Use:

```text
API
 ↓
Create Scan
 ↓
Queue Job
 ↓
Worker
 ↓
Scan
 ↓
Process
 ↓
Save
 ↓
Dashboard
```

A queue can initially be simple.

If scale requires it:

```text
Redis
+
BullMQ
```

can be introduced.

---

# 45. Security Requirements

### Authentication

Supabase Auth.

### Authorization

Supabase/PostgreSQL RLS.

### Company isolation

A user can only access their company's:

```text
Projects
Scans
Findings
```

### GitHub secrets

GitHub credentials/tokens must never be exposed to the frontend.

### API

Validate:

```text
Authentication
Authorization
Input
Repository access
```

---

# 46. Error States

Every major operation needs:

### Loading

```text
Scanning repository...
```

### Success

```text
Scan completed
127 components found
```

### Failure

```text
Scan failed

Unable to read repository.

[ Retry ]
```

### GitHub failure

```text
GitHub connection failed.

[ Reconnect GitHub ]
```

### Empty state

```text
No projects yet.

Connect your first repository.

[ Add Project ]
```

---

# 47. Frontend Requirements

Use the existing boilerplate.

Do not rebuild the design system.

Reuse:

```text
Buttons
Cards
Tables
Dialogs
Dropdowns
Forms
Tabs
Charts
Badges
Navigation
Toast
Modal
Loading states
```

Build product-specific screens on top.

---

# 48. Main Navigation

Recommended:

```text
SecureStack

Dashboard

Projects
  └── All Projects

Security
  └── Findings

Updates

Inventory

Scans

Settings
```

Later:

```text
Integrations
Alerts
Audit Logs
```

---

# 49. Initial Dashboard

For development, it should look like a real product even before the backend is complete.

Example:

```text
Good morning

Open Source Health

┌──────────┐ ┌──────────┐ ┌──────────┐
│   127    │ │    28    │ │    11    │
│Components│ │ Updates  │ │ Security │
└──────────┘ └──────────┘ └──────────┘

Critical Issues
4

Projects
────────────────────────────
Payment API
Web Application
Worker

Recent Findings
────────────────────────────
Axios        HIGH
Redis        HIGH
Next.js      MEDIUM
```

---

# 50. MVP Scope

The first real MVP should deliver:

```text
✓ Signup
✓ Login
✓ Company
✓ Dashboard
✓ Projects
✓ GitHub connection
✓ Multiple projects
✓ Repository connection
✓ Repository scanning
✓ Dependency discovery
✓ Version detection
✓ Latest version
✓ Security findings
✓ CVEs
✓ Severity
✓ EOL
✓ What's Changed
✓ Recommendation
✓ Finding lifecycle
```

---

# 51. Explicitly Out of Scope

Do **not** build these in the first MVP:

```text
Automatic patch deployment
Automatic production changes
Automatic code commits
Automatic PR creation
Kubernetes agent
Endpoint agent
Infrastructure agent
Full CI/CD platform
Jira automation
Slack automation
Enterprise SSO
Complex compliance reporting
```

These can come later.

---

# 52. Success Criteria

SecureStack MVP succeeds when a new customer can do this:

```text
1. Sign up
       ↓
2. Enter Company Name
       ↓
3. Reach Dashboard
       ↓
4. Add Project
       ↓
5. Connect GitHub
       ↓
6. Select Repository
       ↓
7. Scan Repository
       ↓
8. Discover Open-source Components
       ↓
9. Identify Current Versions
       ↓
10. Find Latest Versions
       ↓
11. Detect Security Issues
       ↓
12. Detect EOL
       ↓
13. Show What Changed
       ↓
14. Calculate Risk
       ↓
15. Recommend Upgrade
       ↓
16. Track Finding
```

---

# 53. Final SecureStack Architecture

```text
                         ┌───────────────────┐
                         │     SecureStack   │
                         │   Next.js / React │
                         └─────────┬─────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
              ┌─────────────┐             ┌─────────────┐
              │ Supabase    │             │ SecureStack │
              │ Auth        │             │ API/Workers │
              └─────────────┘             └──────┬──────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │ Supabase        │
                                         │ PostgreSQL      │
                                         └────────┬────────┘
                                                  │
                         ┌────────────────────────┼───────────────────────┐
                         │                        │                       │
                         ▼                        ▼                       ▼
                     companies                projects                 users
                                                  │
                                           ┌──────┴──────┐
                                           ▼             ▼
                                         scans       findings

                                                  │
                                                  ▼
                                         Intelligence Engine
                                                  │
                              ┌───────────────────┼───────────────────┐
                              ▼                   ▼                   ▼
                           GitHub                OSV                 NVD
                           Releases           Security             Security
                              │                   │                   │
                              └───────────────────┼───────────────────┘
                                                  ▼
                                         Risk / Recommendation
```

---

# 54. Final Product Loop

The entire SecureStack product can ultimately be reduced to this:

```text
              CONNECT
                 ↓
              DISCOVER
                 ↓
              IDENTIFY
                 ↓
              COMPARE
                 ↓
              ANALYZE
                 ↓
             PRIORITIZE
                 ↓
               ALERT
                 ↓
              RESOLVE
```

And the most important thing for development is:

> **We don't need to build the whole intelligence platform before testing the product.**

Start with **real Supabase Auth + real Company + real GitHub connection**, use **dummy dashboard data**, then progressively replace dummy data with the real scanner and intelligence engine.

That gives you a clean end-to-end path without over-engineering the first version.
