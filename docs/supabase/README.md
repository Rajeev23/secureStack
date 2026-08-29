# Supabase setup — Phase 1

Run these steps **once** in the [Supabase Dashboard](https://supabase.com/dashboard). The app talks to this project for Auth and the five application tables.

You do **not** need the Supabase CLI. Paste SQL in **SQL Editor**.

## What you will create

| Piece | Where |
| --- | --- |
| Supabase project | Dashboard → New project |
| Auth (email + password) | Authentication → Providers |
| 5 tables + RLS | SQL Editor → files in this folder |
| GitHub OAuth app | GitHub → Developer settings (for repository access) |
| Env vars | `.env.local` in this repo |

---

## 1. Create the Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project**. Pick an org, a name (for example `securestack`), a database password, and a region close to you.
3. Wait until the project is **Active**.

## 2. Copy API keys

1. Open **Project Settings → API Keys** (or **API**).
2. Copy:

| Dashboard label | Env var |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Legacy `anon` JWT (optional fallback) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Secret / `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` |

The app prefers the publishable key and falls back to the legacy anon JWT. Never expose the service role key to the browser. It only lives in server env.

Session cookies are verified and refreshed in `proxy.ts` (Next.js 16) with `getClaims()` when a protected route has an `sb-*-auth-token` cookie. Public pages and anonymous requests do not call Auth. Login and signup use the default Auth client fetch — do not abort those requests. Do not add a separate `middleware.ts` for Supabase.

## 3. Auth settings (required for local signup)

1. **Authentication → Providers → Email**. Enable Email. Leave “Confirm email” **off** while developing so signup can create a session immediately.
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add
     - `http://localhost:3000/**`
     - `http://localhost:3000/auth/callback` (password reset and email links)
     - `http://localhost:3000/reset-password`

## 4. Create tables (run in order)

Open **SQL Editor → New query**. Paste and **Run** each file:

| Order | File | What it does |
| --- | --- | --- |
| 1 | [`01-schema.sql`](./01-schema.sql) | Creates `companies`, `users`, `projects`, `scans`, `findings` (includes `monitoring` JSON) |
| 2 | [`02-rls.sql`](./02-rls.sql) | Enables RLS and company isolation |
| 3 | [`04-phase4.sql`](./04-phase4.sql) | **Only if** you already ran an older `01-schema.sql` without `monitoring` columns |

If a run errors because objects already exist, run [`03-reset.sql`](./03-reset.sql) first, then 01 and 02 again.

## 5. GitHub OAuth app (real repo access)

This is **not** “Login with GitHub”. It is a separate GitHub OAuth App so SecureStack can list and read repositories.

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Application name: `SecureStack` (or `SecureStack local`).
3. Homepage URL: `http://localhost:3000`
4. Authorization callback URL: `http://localhost:3000/api/github/callback`
5. Register the app. Copy **Client ID**. Generate a **Client secret**.

Scopes the app requests: `read:user` and `repo` (private + public repos the user can access).

## 6. Fill `.env.local`

```bash
cp .env.example .env.local
```

Set at least:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/github/callback

# 32+ character random string. Used to encrypt GitHub tokens at rest.
GITHUB_TOKEN_ENCRYPTION_KEY=replace-with-a-long-random-string

# 16+ characters. Required for Vercel Cron (`GET /api/cron/scans`). Optional locally.
CRON_SECRET=
```

Generate an encryption key:

```bash
openssl rand -base64 32
```

Restart `pnpm dev` after saving env.

## 7. Confirm tables in the dashboard

**Table Editor** should show:

```text
companies
users
projects
scans
findings
```

`auth.users` stays in the **Authentication** schema. Do not create a sixth application table.

## Clear data (you asked for this)

You will often wipe rows while iterating. Two options:

### A. Empty the five tables (keep schema + RLS)

Run [`03-reset.sql`](./03-reset.sql) in SQL Editor.

This does **not** delete Auth users. To also remove login accounts: **Authentication → Users** → delete users, or run the Auth wipe at the bottom of `03-reset.sql`.

### B. Drop everything and recreate

1. Run the drop section in [`03-reset.sql`](./03-reset.sql).
2. Run `01-schema.sql`.
3. Run `02-rls.sql`.

## What I need from you

Send back (or put in `.env.local` — do not paste secrets in chat if you can avoid it):

1. Supabase project URL
2. Publishable key (or legacy anon JWT)
3. Service role key
4. GitHub OAuth Client ID + secret
5. Confirmation that email confirmation is **disabled** for local signup

After that, Phase 1 E2E is:

```text
Sign up → name company → dashboard → add project → Connect GitHub → select repo → choose full scan or selected files → project saved → Start Scan
```

Phase 4 monitoring is live: after a scan, SecureStack writes **findings** and can re-scan on a schedule. Existing databases need [`04-phase4.sql`](./04-phase4.sql). Locally use **Settings → Scan due projects now**; production uses Vercel Cron and `CRON_SECRET`.
