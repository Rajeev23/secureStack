# Security Policy

## Supported versions

Security fixes are applied on the default branch (`main` / `master`). Upgrade to the latest commit when advisories are published.

## Authentication

SecureStack uses **Supabase Auth** (email + password). `AUTH_DEV_BYPASS=true` skips auth redirects in local development only and is ignored in production.

Before deploying:

1. Set `ENFORCE_PRODUCTION_ENV=true` so missing secrets fail fast.
2. Configure Upstash Redis for shared login rate limiting across instances.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` and `GITHUB_TOKEN_ENCRYPTION_KEY` out of the client bundle, logs, and git.

GitHub OAuth (`read:user repo`) is for repository access, not login. Classic OAuth has no read-only private-repo scope; scans never write to GitHub.

Treat inventory and vulnerability data as sensitive company information.

## API routes

`proxy.ts` allows `/api/*` without a session cookie so health checks work. Every data route must call `requireSession` (or `CRON_SECRET` for `/api/cron/scans`). Company rows are scoped in services via `requireCompanyContext` / `getProject` because the service-role client bypasses RLS.

## Known dependency notes

Production `pnpm audit --prod` is expected to be clean when using the pinned Next.js version and workspace overrides for `postcss` / `sharp` in `pnpm-workspace.yaml`. Re-run audit after upgrading Next.js.

Please **do not** open a public GitHub issue for security bugs.

Email the maintainers privately (or use GitHub Security Advisories if enabled on the repository) with:

- A description of the issue
- Steps to reproduce
- Affected versions / commit SHA
- Any suggested fix

We aim to acknowledge reports within a few business days.
