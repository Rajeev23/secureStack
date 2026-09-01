---
title: Connect GitHub
description: Authorize GitHub with OAuth or a personal access token so SecureStack can read repositories. This is not a product login.
lastUpdated: 2026-09-01
related:
  - href: /documentation/scan
    title: Run a scan
    description: After GitHub is connected, pick repositories and start a scan.
  - href: /documentation/self-host
    title: Self-host
    description: OAuth app settings, GITHUB_TOKEN, and encryption key.
---

Connecting GitHub gives SecureStack **read access to repositories** for this browser session. It is **not** an account. Scans **never write** to GitHub (no commits, no issues, no pull requests).

You can skip this page and [upload an SBOM or manifests](/documentation/scan) instead.

## Ways to connect

| Method | When to use | Where the token lives |
| --- | --- | --- |
| **Connect GitHub** (OAuth) | Default on `/scan` | Encrypted httpOnly cookie `ss_github`, about **one hour** |
| **Personal access token** | You prefer a PAT, or OAuth is not configured | Same cookie |
| **`GITHUB_TOKEN` on the server** | Self-host; skip OAuth for everyone on that instance | Process environment, not a cookie |

OAuth scope is `read:user repo`. A pasted PAT needs **repo read** (classic `repo` for private repos, or fine-grained Contents: Read).

## OAuth

1. Open `/scan` and leave the source on **GitHub**.
2. Click **Connect GitHub**.
3. Approve access on GitHub. The callback is `/api/github/callback`.
4. You return to `/scan` connected as your GitHub login.

The server stores the access token in cookie `ss_github`. The cookie is **httpOnly** and **encrypted**. API responses never send the token to JavaScript. Listing repositories and scanning happen on the server.

If the OAuth state expires, you see “GitHub connection expired. Try again.” Click **Connect GitHub** again.

## Personal access token

1. On `/scan`, paste a token in **Personal access token**.
2. Click **Use token**.
3. The UI shows **Connected as** your GitHub login.

The PAT is sent once to `POST /api/session/github` and then held in the same encrypted cookie. It is not written to a database.

## Server token (self-host)

If the host sets `GITHUB_TOKEN`, `/scan` can show **Connected as GITHUB_TOKEN via GITHUB_TOKEN on this server.** Visitors do not need OAuth. See [Self-host](/documentation/self-host).

OAuth and pasted PATs still require `GITHUB_TOKEN_ENCRYPTION_KEY` (16+ characters) so the cookie can be encrypted.

## After you are connected

Connecting **does not start a scan**. Next: search and check repositories, choose entire repository or specific files, then scan. That flow is [Run a scan](/documentation/scan).

## Disconnect

**Clear scan** in the product sidebar drops the in-tab report **and** the GitHub cookie (`DELETE /api/session/github`). Closing the tab discards the report; the cookie expires on its own after about an hour.
