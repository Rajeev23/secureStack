# Security Policy

## Supported versions

Security fixes are applied on the default branch (`main` / `master`). Upgrade to the latest commit when advisories are published.

## Authentication

There is no product login and no user database. The app is public.

GitHub OAuth (`read:user repo`) is repository access, not login. Classic OAuth has no read-only private-repo scope; scans never write to GitHub. Tokens live in an encrypted httpOnly cookie (`ss_github`) or `GITHUB_TOKEN` on the server. They are never returned to JavaScript and are not written to a database.

Before deploying:

1. Set `GITHUB_TOKEN_ENCRYPTION_KEY` if you use OAuth or a pasted PAT.
2. Configure Upstash Redis if you need shared scan rate limiting across instances.
3. Keep `GITHUB_CLIENT_SECRET` and `GITHUB_TOKEN_ENCRYPTION_KEY` out of the client bundle, logs, and git.

Treat inventory and vulnerability data as sensitive.

## API routes

`proxy.ts` allows the product without a session. Scan and GitHub session routes are rate-limited. Old `/login` and `/signup` URLs redirect to `/dashboard`.

## Known dependency notes

Production `pnpm audit --prod` is expected to be clean when using the pinned Next.js version and workspace overrides for `postcss` / `sharp` / `browserslist` in `pnpm-workspace.yaml`. Re-run audit after upgrading Next.js.

Please **do not** open a public GitHub issue for security bugs.

Email the maintainers privately (or use GitHub Security Advisories if enabled on the repository) with:

- A description of the issue
- Steps to reproduce
- Affected versions / commit SHA
- Any suggested fix

We aim to acknowledge reports within a few business days.
