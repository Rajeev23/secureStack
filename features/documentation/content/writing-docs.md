---
title: Writing docs
description: Add a markdown file, register it in the docs sidebar, and keep docs in sync when code changes.
lastUpdated: 2026-08-28
related:
  - href: /documentation
    title: Overview
    description: How the docs layout is put together.
  - href: /documentation/architecture/tenancy
    title: Tenancy
    description: Example of a product doc that must stay aligned with config/app.ts.
---

Docs are markdown files **or** live catalog pages. Public site: `/documentation`.

## Keep docs in sync with code

**Rule:** if you change a feature, update the matching documentation in the **same** change.

1. Check `docs/DOC_MAP.md` at the repo root for which pages map to your files.
2. Edit those markdown files (and `README.md` / `docs/HANDOFF.md` when clone setup changes).
3. Bump `lastUpdated` in frontmatter.
4. Register new pages in `docs-nav.ts` (below).
5. Run `pnpm test:run` after adding or changing a page.

Cursor agents also follow `.cursor/rules/docs-sync.mdc` and `AGENTS.md`.

## Add a markdown page

1. Create `features/documentation/content/<path>.md`
2. Register it in `features/documentation/data/docs-nav.ts` with `file`
3. Open `/documentation/<path>` — the catch-all route loads the file

```md filename="features/documentation/content/layout/sidebar.md"
---
title: Sidebar
description: How the app sidebar reads config/navigation.ts.
lastUpdated: 2026-08-28
related:
  - href: /documentation/layout/workspaces
    title: Context switcher
---

## Nested groups

Pass `children` (or `items`) on a `NavItem` without an `href` to make a collapsible group.
```

```ts filename="features/documentation/data/docs-nav.ts"
{
  title: "Layout",
  items: [
    { title: "Sidebar", href: "/documentation/layout/sidebar", file: "layout/sidebar.md" },
  ],
}
```

Set `collapsible: false` on a group to keep it always expanded (**Getting started**). Other groups collapse by default and open when the current page is inside them.

Keep them in sync. Live catalog pages set `catalog` instead of `file` and render React previews from `features/documentation/catalog/`.

## Frontmatter

| Field | Required | Purpose |
| --- | --- | --- |
| `title` | Yes | Article `h1` |
| `description` | Yes | Metadata + intro context |
| `lastUpdated` | No | `YYYY-MM-DD` shown under the title — bump when you edit |
| `related` | No | **Next steps** cards (`href`, `title`, `description`) |

Headings (`##` / `###`) become the right-hand **On this page** rail on desktop. Both desktop rails stay sticky below the header without independent scroll areas, while the center article moves. The right rail also has **Scroll to top**, which fades in after you start scrolling. Small screens do not duplicate the TOC above the article. `Copy link` copies the current page URL. `copyOptions.markdown` in `copy-page-button.tsx` can enable the title + markdown payload later.

## Shared docs

When two APIs overlap, put the common contract on one page and link it from `related`. Do not fork a second copy of the same prop table unless a type actually diverges.

## Code fences

Use `filename="…"` or `title="…"` in the fence meta. The header shows a dark language icon (TS, JS, …) and the file path — not a second `tsx` label next to a `.tsx` file. A copy button sits on the right. Code is syntax highlighted; there is no language dropdown.

Documentation-only CSS, including syntax token colors, lives in `styles/docs.css` and is imported by `app/documentation/layout.tsx`. Keep docs styling out of the app-wide `styles/globals.css`.

    ```tsx filename="components/shared/page-header.tsx"
    <PageHeader title="Projects" description="Repositories this company monitors." />
    ```

## Checks

- Register every markdown page in `features/documentation/data/docs-nav.ts`.
- Run `pnpm test:run` after adding or changing a page.
