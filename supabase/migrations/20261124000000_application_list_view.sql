
create or replace view public.application_list
with (security_invoker = on)
as
select
  a.id,
  a.user_id,
  a.company_id,
  c.name as company_name,
  a.resume_id,
  a.job_title,
  a.location,
  a.job_type,
  a.work_mode,
  a.salary_min,
  a.salary_max,
  a.salary_currency,
  a.job_url,
  a.source,
  a.status,
  a.applied_at,
  a.notes,
  a.position,
  a.created_at,
  a.updated_at
from public.applications a
join public.companies c on c.id = a.company_id;

grant select on public.application_list to authenticated;
