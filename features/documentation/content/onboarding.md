---
title: Onboarding
description: Signup creates a Supabase Auth user. Then you name your company and go to the dashboard.
lastUpdated: 2026-08-28
related:
  - href: /documentation/architecture/tenancy
    title: Company & GitHub
    description: How companies, projects, and GitHub tokens are stored.
  - href: /documentation/boilerplate-patterns
    title: Project patterns
    description: Follow the project conventions when extending setup.
---

New users sign up from the public home page (or `/signup`) with **name**, **email**, and **password**. Signup creates a Supabase Auth session and sends them to `/onboarding` to name the **company**. After that they land on `/dashboard`.

## Public entry

```text
/  (home)
  → Sign in (header) → /login → /dashboard (or /onboarding)
  → Sign up (header) → /signup → /onboarding → company → /dashboard
  → Forgot password → /forgot-password → email link → /reset-password
  → Sign up (home form) → session → /onboarding → company → /dashboard
```

- Home (`/`) is public. It does not require a session and does not wait on Auth.
- Visiting `/dashboard` without a session cookie redirects to `/login` immediately.
- Header **Sign in** opens `/login` immediately. Header **Sign up** opens `/signup`. Those pages do not wait on Auth.
- Sign in and sign up wait for Supabase Auth to finish. The app does not abort those requests after a few seconds.
- Home **Sign up** (the form on `/`) asks for name, email, and password. The name is stored on the user and shown in the dashboard greeting and **Settings → Account**.
- **Forgot password** on `/login` sends a reset email. The link returns to `/auth/callback`, then `/reset-password`.
- The authenticated dashboard layout redirects users whose company setup is incomplete.
- Completed users go directly to `/dashboard`.

## Signup fields

| Field | Rule |
| --- | --- |
| Name | Required. Stored on the Auth user and copied to `users.name` at onboarding. |
| Email | Required. Must be a valid email address. |
| Password | Required. At least 8 characters. |
| Company name | Collected on `/onboarding` after signup. First user is Admin. |

## Account

Signed-in users manage their own profile at **Settings → Account** (`/settings/account`): name, email (read-only), and update password.

## APIs

| Request | Result |
| --- | --- |
| `POST /api/auth/signup` with `{ name, email, password }` | Create the Auth user, set the session, send `redirectTo: "/onboarding"` |
| `POST /api/auth/forgot-password` with `{ email }` | Send a reset email if the address exists (always returns success) |
| `POST /api/auth/reset-password` with `{ password }` | Set a new password from a recovery session |
| `GET/PATCH /api/account` | Load or update the signed-in user’s name |
| `POST /api/account/password` | Change password while signed in (current + new) |
| `POST /api/onboarding` with `{ name }` | Create the company and application user row |
| `GET /api/onboarding` | Resume setup if the company is still missing |
