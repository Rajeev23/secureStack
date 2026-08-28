# Documentation sync map

When you change product behavior, update the matching docs **in the same PR/commit**. Agents and humans should use this table.

| If you change… | Also update… |
|----------------|--------------|
| Company / GitHub / five-table schema | `docs/supabase/*`, `features/documentation/content/architecture/tenancy.md`, `README.md`, `docs/HANDOFF.md`, `AGENTS.md` |
| Onboarding flow (`features/onboarding`, `/api/onboarding`) | `features/documentation/content/onboarding.md`, `architecture/tenancy.md` |
| Company context store / sidebar label | `features/documentation/content/layout/workspaces.md`, `layout/sidebar.md` |
| `config/navigation.ts` (settings items, docs link) | `features/documentation/content/layout/sidebar.md`, `boilerplate-patterns.md` (Project patterns) if patterns change |
| Auth (signup/login/session/rate limit) | `README.md` Auth section, `docs/HANDOFF.md`, `AGENTS.md` Auth, `features/documentation/content/onboarding.md` |
| Public home (`/`, `features/home`) | `README.md`, `docs/HANDOFF.md`, `getting-started.md`, `onboarding.md` |
| Public `/documentation` layout or docs nav | `features/documentation/content/getting-started.md`, `writing-docs.md`, `features/documentation/data/docs-nav.ts` |
| Settings company page | `architecture/tenancy.md`, `layout/workspaces.md`, `docs/HANDOFF.md` |
| Shared UI primitives | Matching page under `features/documentation/content/` or catalog |
| Projects (one repo, list table, delete) | `features/documentation/content/scanning.md`, `architecture/tenancy.md`, `docs/HANDOFF.md`, `AGENTS.md` |
| Findings / intelligence (`features/findings`, OSV, EOL, release notes) | `features/documentation/content/intelligence.md`, `docs/HANDOFF.md` (caps: 400 unique packages, 80 manifests, 40 release notes; inventory tiers) |
| Issue / severity / status chip colors | `config/issue-palette.ts`; chips on dashboard, inventory, updates, findings |
| Scheduled scans / alerts / finding status | `features/documentation/content/monitoring.md`, `docs/supabase/04-phase4.sql`, `docs/HANDOFF.md` |
| SBOM upload / Gemfile / Composer / impact / P1–P4 | `features/documentation/content/scanning.md`, `intelligence.md`, `monitoring.md`, `docs/HANDOFF.md` |
| New feature page + sidebar route | In-app doc if user-facing; always `pnpm validate:nav`; mention in HANDOFF if it is a starter pattern |
| Folder layout (`lib/` vs `services/`) | `AGENTS.md`, `README.md`, `docs/HANDOFF.md`, `boilerplate-patterns.md`, `getting-started.md` |

## Rules of thumb

1. **Same change set** — do not land a behavior change without the doc update.
2. **Bump `lastUpdated`** in markdown frontmatter when you edit an article.
3. **Register new markdown** in `features/documentation/data/docs-nav.ts`.
4. **Human handoff** — keep `README.md` and `docs/HANDOFF.md` accurate for clones.
5. **Verify** — `pnpm test:run` and skim `/documentation` locally for the pages you touched.

See also: [Writing docs](/documentation/writing-docs) (in-app) and the Cursor rule `.cursor/rules/docs-sync.mdc`.
