---
title: Data fetching
description: TanStack Query plus the shared API client used on the dashboard.
lastUpdated: 2026-08-28
related:
  - href: /documentation/boilerplate-patterns
    title: Project patterns
    description: Where hooks and API routes live in a feature module.
  - href: /documentation/ui/data-display
    title: Data display
    description: Table, badge, and card primitives used on list pages.
---

Client components do not call databases or third-party APIs directly. They call **internal** `/api/*` routes through `apiGet` / `apiPost` / `apiPatch` / `apiDelete`, then cache the result with TanStack Query.

## Hook pattern

Reference: `features/dashboard/hooks/use-dashboard-stats.ts`

```ts filename="features/dashboard/hooks/use-dashboard-stats.ts"
import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api/client"

type DashboardStatsResponse = {
  stats: { label: string; value: string }[]
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () =>
      apiGet<DashboardStatsResponse>("/api/dashboard/stats").then(
        (data) => data.stats,
      ),
  })
}
```

## API client

`lib/api/client.ts` sets JSON headers, skips the fetch cache, and throws `ApiError` on non-OK responses.

```ts filename="lib/api/client.ts"
import { apiGet, apiPost, apiRequest } from "@/lib/api/client"

const stats = await apiGet<DashboardStatsResponse>("/api/dashboard/stats")
await apiPost("/api/example", { name: "Acme" })
```

Use `apiRequest` when you need `PUT` / `PATCH` / `DELETE`. Prefer `apiDelete` for `DELETE`.

## Route handler

Reference: `app/api/dashboard/stats/route.ts`

```ts filename="app/api/dashboard/stats/route.ts"
import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/session"
import { jsonError } from "@/lib/api/handle-error"

export async function GET() {
  const session = await requireSession()
  if (!session.ok) return session.response

  try {
    // Load company-scoped stats from services, then:
    return NextResponse.json({ stats: [] })
  } catch (error) {
    return jsonError(error)
  }
}
```

`requireSession` checks the signed session cookie (or `AUTH_DEV_BYPASS` in non-production) and returns `{ ok: true, userId }` or a ready-made `401` response with `{ error: "Unauthorized." }`.

Keep secrets in server code, not in feature hooks.

> **Auth note:** `proxy.ts` currently allows all `/api/*` routes without a session (so `/api/health` still works). Protect data routes with `requireSession` (or tighten the proxy matcher) when you add real APIs.

## Server-driven lists

When the list is paginated on the server, do **not** send the full dataset to the browser. Return `{ data, meta }` using `createPaginatedMeta` from `@/lib/pagination`. Search and page changes then drive `offset` / `limit` query params instead of client slicing.

```ts filename="lib/pagination.ts"
import { createPaginatedMeta, paginatedResponseSchema } from "@/lib/pagination"

const meta = createPaginatedMeta(total, page, pageSize)
```
