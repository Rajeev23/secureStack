-- SecureStack Phase 1 — row level security
-- A signed-in user may only see rows for their company.
-- GitHub tokens live on companies.github_connection and are revoked from the
-- authenticated role (only the service role / server can read the token column).
--
-- Run AFTER 01-schema.sql.

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.users
  where id = auth.uid()
  limit 1
$$;

revoke all on function public.current_company_id() from public;
grant execute on function public.current_company_id() to authenticated, service_role;

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.scans enable row level security;
alter table public.findings enable row level security;

-- Recreate policies idempotently
drop policy if exists companies_select_own on public.companies;
drop policy if exists companies_update_own on public.companies;
drop policy if exists users_select_company on public.users;
drop policy if exists users_update_self on public.users;
drop policy if exists projects_all_company on public.projects;
drop policy if exists scans_all_company on public.scans;
drop policy if exists findings_all_company on public.findings;

create policy companies_select_own
  on public.companies
  for select
  to authenticated
  using (id = public.current_company_id());

create policy companies_update_own
  on public.companies
  for update
  to authenticated
  using (id = public.current_company_id())
  with check (id = public.current_company_id());

create policy users_select_company
  on public.users
  for select
  to authenticated
  using (company_id = public.current_company_id());

create policy users_update_self
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy projects_all_company
  on public.projects
  for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy scans_all_company
  on public.scans
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = scans.project_id
        and p.company_id = public.current_company_id()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = scans.project_id
        and p.company_id = public.current_company_id()
    )
  );

create policy findings_all_company
  on public.findings
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = findings.project_id
        and p.company_id = public.current_company_id()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = findings.project_id
        and p.company_id = public.current_company_id()
    )
  );

-- Hide the GitHub token column from the browser/anon JWT role.
-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY for token read/write.
revoke all on public.companies from anon, authenticated;
grant select (id, name, slug, status, monitoring, created_at, updated_at) on public.companies to authenticated;
grant update (name, slug, status, monitoring, updated_at) on public.companies to authenticated;

grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.scans to authenticated;
grant select, insert, update, delete on public.findings to authenticated;
