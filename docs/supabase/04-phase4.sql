-- SecureStack Phase 4 — monitoring settings on existing tables (no 6th table).
-- Run this once in the SQL Editor if you already applied 01-schema.sql before Phase 4.

alter table public.companies
  add column if not exists monitoring jsonb not null default '{"scanIntervalHours":24,"alertsEnabled":true}'::jsonb;

alter table public.projects
  add column if not exists monitoring jsonb not null default '{"enabled":true}'::jsonb;

-- Column grants were listed explicitly so github_connection stays hidden.
-- Re-grant so monitoring is visible to the authenticated role (server still uses service role).
grant select (id, name, slug, status, monitoring, created_at, updated_at) on public.companies to authenticated;
grant update (name, slug, status, monitoring, updated_at) on public.companies to authenticated;
