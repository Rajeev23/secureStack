# Documentation sync map

When you change product behavior, update the matching docs **in the same PR/commit**. Agents and humans should use this table.

| If you change… | Also update… |
|----------------|--------------|
| Session scan / no-account flow | `features/documentation/content/architecture/tenancy.md`, `onboarding.md`, `README.md`, `docs/HANDOFF.md`, `AGENTS.md` |
| Public home (`/`, `features/home`) | `README.md`, `docs/HANDOFF.md`, `getting-started.md`, `onboarding.md` |
| Public `/documentation` layout or docs nav | `features/documentation/content/getting-started.md`, `writing-docs.md`, `features/documentation/data/docs-nav.ts` |
| `config/navigation.ts` | `features/documentation/content/layout/sidebar.md`, `boilerplate-patterns.md` |
| GitHub session cookie / scan APIs | `features/documentation/content/scanning.md`, `architecture/tenancy.md` |
| Findings / intelligence | `features/documentation/content/intelligence.md`, `docs/HANDOFF.md` |
| Issue / severity / status chip colors | `config/issue-palette.ts`; chips on dashboard, inventory, updates, findings |
| New feature page + sidebar route | In-app doc if user-facing; always `pnpm validate:nav`; mention in HANDOFF |
| Folder layout (`lib/` vs `services/`) | `AGENTS.md`, `README.md`, `docs/HANDOFF.md`, `boilerplate-patterns.md`, `getting-started.md` |

## Rules of thumb

1. **Same change set** — do not land a behavior change without the doc update.
2. **Bump `lastUpdated`** in markdown frontmatter when you edit an article.
3. **Register new markdown** in `features/documentation/data/docs-nav.ts`.
4. **Human handoff** — keep `README.md` and `docs/HANDOFF.md` accurate for clones.
5. **Verify** — `pnpm test:run` and skim `/documentation` locally for the pages you touched.

See also: [Writing docs](/documentation/writing-docs) (in-app) and the Cursor rule `.cursor/rules/docs-sync.mdc`.
