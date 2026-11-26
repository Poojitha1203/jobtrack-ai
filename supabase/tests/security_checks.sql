-- =============================================================================
-- Security checks — run in the Supabase SQL Editor. Read-only.
-- Every query should return ZERO rows. Any row returned is a problem to fix.
-- =============================================================================

-- 1. Tables in the public schema without Row Level Security
select 'RLS disabled' as problem, c.relname as object
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity

union all

-- 2. Tables with RLS on but no policies (fine only for server-only tables)
select 'RLS on, no policies', c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)

union all

-- 3. Admin views readable by logged-out or normal users
select 'admin view exposed to ' || g.grantee, g.table_name
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.table_name like 'admin\_%'
  and g.grantee in ('anon', 'authenticated', 'PUBLIC')

union all

-- 4. Users able to change their own role, email or id
select 'profiles.' || c.column_name || ' writable by authenticated', 'profiles'
from information_schema.column_privileges c
where c.table_schema = 'public' and c.table_name = 'profiles'
  and c.grantee = 'authenticated' and c.privilege_type in ('UPDATE', 'INSERT')
  and c.column_name in ('id', 'role', 'email')

union all

-- 5. Billing tables writable by users (only the server may write them)
select 'writable by ' || g.grantee || ' (' || g.privilege_type || ')', g.table_name
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.table_name in ('subscriptions', 'payments')
  and g.grantee in ('anon', 'authenticated')
  and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE')

union all

-- 6. Anything granted to logged-out visitors
select 'anon can ' || g.privilege_type, g.table_name
from information_schema.role_table_grants g
where g.table_schema = 'public' and g.grantee = 'anon'

union all

-- 7. SECURITY DEFINER functions without a fixed search_path
select 'security definer without search_path', p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')

union all

-- 8. Resume storage bucket must be private
select 'public storage bucket', b.id
from storage.buckets b
where b.id = 'resumes' and b.public;
