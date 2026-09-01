# Documentation sync map

When you change product behavior, update the matching docs **in the same PR/commit**.

| If you change… | Also update… |
|----------------|--------------|
| Connect GitHub (OAuth, PAT, cookie) | `features/documentation/content/connect.md`, `self-host.md`, `README.md`, `AGENTS.md` |
| Scan UI or `POST /api/session/scan` | `features/documentation/content/scan.md`, `connect.md` if the GitHub step changed |
| Dashboard / Report / package pages | `features/documentation/content/report.md`, `getting-started.md` |
| Findings / OSV / EOL / P1–P4 | `features/documentation/content/intelligence.md` |
| Self-host env, Docker, rate limits | `features/documentation/content/self-host.md`, `README.md`, `.env.example` |
| Public home (`/`, `features/home`) | `README.md`, `getting-started.md` |
| Documentation placement (home vs app sidebar) | `config/app.ts` (`documentation.home` / `documentation.sidebar`) |
| Docs sidebar | `features/documentation/data/docs-nav.ts` |
| New product page + app sidebar | `pnpm validate:nav`; mention in `docs/HANDOFF.md` if clone setup changes |
| Folder layout (`lib/` vs `services/`) | `AGENTS.md`, `README.md`, `docs/HANDOFF.md` |

## Rules of thumb

1. **Same change set** — do not land a behavior change without the doc update.
2. **Bump `lastUpdated`** in markdown frontmatter when you edit an article.
3. **Register new markdown** in `features/documentation/data/docs-nav.ts`.
4. **Human handoff** — keep `README.md` and `docs/HANDOFF.md` accurate for clones.
5. **Verify** — `pnpm test:run` and skim `/documentation` locally for the pages you touched.

In-app docs are **product** docs (how to connect, scan, and read findings). Contributor conventions live in `AGENTS.md` and `docs/HANDOFF.md`, not in `/documentation`.
