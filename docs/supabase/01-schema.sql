-- SecureStack Phase 1 — application schema
-- Five tables. auth.users remains in the Auth schema (do not recreate it).
--
-- Run this in Supabase SQL Editor AFTER creating the project.
-- If objects already exist, run 03-reset.sql first.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- companies
-- github_connection stores an encrypted GitHub OAuth payload (server-only).
-- It is NOT one of the TRD "display" columns; it keeps GitHub tokens off a
-- sixth table. RLS + column grants hide it from the authenticated client role.
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended')),
  github_connection jsonb,
  monitoring jsonb not null default '{"scanIntervalHours":24,"alertsEnabled":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_slug_idx on public.companies (slug);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- users (application profile)
-- id matches auth.users.id
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'ADMIN'
    check (role in ('ADMIN', 'MEMBER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_unique on public.users (lower(email));
create index if not exists users_company_id_idx on public.users (company_id);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- projects
-- repositories is jsonb with at most one item:
--   [{ provider, repositoryId, fullName, url, branch }]
-- The app enforces one GitHub repository per project.
-- monitoring jsonb includes:
--   enabled, environment,
--   scanMode ("full" | "selected"), files (repo-relative paths),
--   scanScopeConfigured (false until the company chooses full vs selected files).
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  description text,
  repositories jsonb not null default '[]'::jsonb,
  monitoring jsonb not null default '{"enabled":true}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_company_id_idx on public.projects (company_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- scans (created in Phase 1, populated in Phase 2)
-- -----------------------------------------------------------------------------
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  source text not null default 'github',
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  components_found integer not null default 0,
  findings_found integer not null default 0,
  result_snapshot jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists scans_project_id_idx on public.scans (project_id);
create index if not exists scans_created_at_idx on public.scans (created_at desc);

-- -----------------------------------------------------------------------------
-- findings (created in Phase 1, populated in Phase 3)
-- -----------------------------------------------------------------------------
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  component_name text not null,
  ecosystem text,
  current_version text,
  recommended_version text,
  finding_type text not null
    check (finding_type in ('SECURITY', 'UPDATE', 'EOL')),
  severity text not null
    check (severity in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  external_reference text,
  status text not null default 'OPEN'
    check (status in ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'ACCEPTED_RISK')),
  recommendation text,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists findings_project_id_idx on public.findings (project_id);
create index if not exists findings_status_idx on public.findings (status);

drop trigger if exists findings_set_updated_at on public.findings;
create trigger findings_set_updated_at
before update on public.findings
for each row execute function public.set_updated_at();
