
create view public.admin_user_list
with (security_invoker = true) as
select
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  case
    when s.plan = 'pro'
     and s.status = 'active'
     and (s.current_period_end is null or s.current_period_end > now())
    then 'pro' else 'free'
  end as plan,
  s.current_period_end,
  coalesce(s.cancel_at_period_end, false) as cancel_at_period_end,
  (select count(*) from public.applications a where a.user_id = p.id)::int as application_count,
  (select max(a.updated_at) from public.applications a where a.user_id = p.id) as last_activity_at
from public.profiles p
left join public.subscriptions s on s.user_id = p.id;

create view public.admin_application_status_counts
with (security_invoker = true) as
select status, count(*)::int as count
from public.applications
group by status;

create view public.admin_signups_by_month
with (security_invoker = true) as
select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*)::int as count
from public.profiles
where created_at >= date_trunc('month', now()) - interval '11 months'
group by 1;

create view public.admin_payment_totals
with (security_invoker = true) as
select status, count(*)::int as count, coalesce(sum(amount), 0)::bigint as amount
from public.payments
group by status;

revoke all on
  public.admin_user_list,
  public.admin_application_status_counts,
  public.admin_signups_by_month,
  public.admin_payment_totals
from public, anon, authenticated;

grant select on
  public.admin_user_list,
  public.admin_application_status_counts,
  public.admin_signups_by_month,
  public.admin_payment_totals
to service_role;
