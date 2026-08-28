---
title: UI components
description: Living reference for the reusable components in SecureStack — previews, variants, and copy-paste usage.
lastUpdated: 2026-08-28
related:
  - href: /documentation/ui/button
    title: Button
    description: Primary, outline, ghost, and destructive actions.
  - href: /documentation/ui/forms
    title: Forms
    description: Input, select, checkbox, textarea, and labels.
  - href: /documentation/ui/data-display
    title: Data display
    description: Badge, table, avatar, and card primitives.
---

This section is the **UI catalog**. Each page renders the real component, not a screenshot, so you can see variants, states, and dark mode as they ship in the app.

## What is documented

| Page | Components |
| --- | --- |
| [Button](/documentation/ui/button) | Button variants, sizes, disabled |
| [Forms](/documentation/ui/forms) | Input, Textarea, Select, Checkbox, Label |
| [Data display](/documentation/ui/data-display) | Badge, Table status, Avatar, Card, Table |
| [Overlays](/documentation/ui/overlays) | Dialog, Sheet, Dropdown, Tooltip, Toast, Command |
| [Feedback](/documentation/ui/feedback) | Skeleton, Empty, Error, page loading |
| [Navigation](/documentation/ui/navigation) | Tabs, Breadcrumb |

Primitives live in `components/ui/`. Feedback patterns live in `components/feedback/`. List pages use `components/ui/table` plus page-level tables in each feature.

## Visual system

Colors are locked in `styles/globals.css`: near-black ink (`--primary` / `--ink`) on a near-white canvas (`--background` / `--canvas`), with hairline borders and Vercel blue for links. Light and dark mode toggle with `next-themes`. There is no in-app color picker, scale, or radius control.

Marketing CTAs use the `pill` button size. App chrome (nav, forms, dashboard) uses the default 6px square.

## How to add a component

1. Add the primitive with the shadcn CLI into `components/ui/`.
2. Create or extend a catalog section in `features/documentation/catalog/sections/`.
3. Register the page in `features/documentation/data/docs-nav.ts` with a `catalog` id.

Do not document internal implementation details. Show purpose, a live preview, a short usage snippet, and accessibility notes when they matter.

## Missing primitives

Switch, radio, alert, and standalone pagination are not bundled. Add them with the shadcn CLI when your product needs them.
