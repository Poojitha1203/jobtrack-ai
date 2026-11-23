
grant usage on schema public to authenticated, service_role;

-- profiles: read your own row; update only these columns (never role or email)
grant select on public.profiles to authenticated;
grant update (full_name, headline, location, weekly_goal) on public.profiles to authenticated;

-- Personal data: full CRUD, limited to the user's own rows by RLS
grant select, insert, update, delete on
  public.companies,
  public.resumes,
  public.applications,
  public.interviews,
  public.user_skills,
  public.reminders,
  public.user_question_progress
to authenticated;

-- Billing: read-only for users (written by the server after payment verification)
grant select on public.subscriptions, public.payments to authenticated;

-- Catalogs: everyone signed in can read; RLS allows writes only for admins
grant select, insert, update, delete on public.skills, public.interview_questions to authenticated;

-- Used inside RLS policies, so the authenticated role must be able to call it
grant execute on function public.is_admin() to authenticated;

-- The server's secret key (service_role) bypasses RLS for payments and admin features
grant all on all tables in schema public to service_role;
grant execute on function public.is_admin() to service_role;
