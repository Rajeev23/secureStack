-- SecureStack — wipe application data
-- Run in SQL Editor when you want a clean database.
--
-- Option A (default): empty the five tables, keep schema + RLS.
-- Option B: drop schema objects so you can re-run 01-schema.sql and 02-rls.sql.
--
-- This does NOT delete Auth users unless you uncomment the Auth wipe at the bottom.

-- =============================================================================
-- Option A — truncate tables (safe to re-run; keeps RLS and columns)
-- =============================================================================

truncate table public.findings restart identity cascade;
truncate table public.scans restart identity cascade;
truncate table public.projects restart identity cascade;
truncate table public.users restart identity cascade;
truncate table public.companies restart identity cascade;

-- =============================================================================
-- Option B — drop everything (uncomment, then run 01-schema.sql + 02-rls.sql)
-- =============================================================================

-- drop table if exists public.findings cascade;
-- drop table if exists public.scans cascade;
-- drop table if exists public.projects cascade;
-- drop table if exists public.users cascade;
-- drop table if exists public.companies cascade;
-- drop function if exists public.current_company_id();
-- drop function if exists public.set_updated_at();

-- =============================================================================
-- Optional — delete Auth users (logins). Uncomment to also clear Authentication.
-- =============================================================================

-- delete from auth.users;
