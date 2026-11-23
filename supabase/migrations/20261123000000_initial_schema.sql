-- =============================================================================
-- JobTrack AI — initial database schema
--
-- How to run: Supabase Dashboard → SQL Editor → New query → paste this whole
-- file → Run. Run it ONCE on a fresh project.
--
-- Security model
--   * Row Level Security (RLS) is enabled on every table.
--   * Personal tables: a user can only read/write rows where user_id = their id.
--   * Catalog tables (skills, interview_questions): readable by any signed-in
--     user, writable only by admins.
--   * subscriptions / payments: users can only READ their own rows. Writes
--     happen on the server with the secret key after payment verification.
--   * profiles.role can't be changed by users (column-level privileges).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Enum types (fixed lists of allowed values)
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('user', 'admin');
create type public.application_status as enum ('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected');
create type public.job_type as enum ('full_time', 'part_time', 'contract', 'internship', 'freelance');
create type public.work_mode as enum ('remote', 'hybrid', 'onsite');
create type public.interview_type as enum ('phone', 'video', 'onsite');
create type public.interview_result as enum ('pending', 'passed', 'failed', 'cancelled');
create type public.skill_level as enum ('beginner', 'intermediate', 'advanced');
create type public.question_category as enum ('javascript', 'react', 'html', 'css', 'nodejs', 'sql', 'rest_api', 'git', 'hr', 'behavioral');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');
create type public.practice_status as enum ('not_started', 'practicing', 'confident');
create type public.reminder_type as enum ('interview', 'follow_up', 'deadline', 'custom');
create type public.subscription_plan as enum ('free', 'pro');
create type public.subscription_status as enum ('active', 'cancelled', 'expired');
create type public.payment_status as enum ('created', 'paid', 'failed');


-- -----------------------------------------------------------------------------
-- 2. Shared trigger: keep updated_at current on every UPDATE
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

-- One profile per auth user (created automatically by a trigger, see section 6).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '' check (char_length(full_name) <= 100),
  headline    text check (char_length(headline) <= 150),
  location    text check (char_length(location) <= 100),
  weekly_goal smallint not null default 5 check (weekly_goal between 1 and 100),
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 150),
  website       text check (char_length(website) <= 500),
  location      text check (char_length(location) <= 150),
  industry      text check (char_length(industry) <= 100),
  contact_name  text check (char_length(contact_name) <= 100),
  contact_email text check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes         text check (char_length(notes) <= 5000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Lets other tables reference (id, user_id) together, which guarantees
  -- you can only link YOUR application to YOUR company.
  unique (id, user_id)
);

create table public.resumes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 150),
  file_path      text not null,            -- path inside the "resumes" storage bucket (Phase 7)
  file_name      text not null check (char_length(file_name) <= 255),
  file_size      integer not null check (file_size > 0 and file_size <= 5242880), -- max 5 MB
  extracted_text text,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id)
);

create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  company_id      uuid not null,
  resume_id       uuid,
  job_title       text not null check (char_length(job_title) between 1 and 150),
  location        text check (char_length(location) <= 150),
  job_type        public.job_type,
  work_mode       public.work_mode,
  salary_min      integer check (salary_min >= 0),
  salary_max      integer check (salary_max >= 0),
  salary_currency char(3) not null default 'INR',
  job_description text check (char_length(job_description) <= 20000),
  job_url         text check (char_length(job_url) <= 2000),
  source          text check (char_length(source) <= 100),
  status          public.application_status not null default 'wishlist',
  applied_at      date,
  notes           text check (char_length(notes) <= 5000),
  position        integer not null default 0,  -- card order inside a Kanban column (Phase 5)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_max >= salary_min),
  unique (id, user_id),
  -- A company with applications can't be deleted by accident.
  foreign key (company_id, user_id) references public.companies (id, user_id) on delete restrict,
  -- Deleting a resume just unlinks it (only resume_id is set to NULL).
  foreign key (resume_id, user_id) references public.resumes (id, user_id) on delete set null (resume_id)
);

create table public.interviews (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  application_id    uuid not null,
  round             text not null check (char_length(round) between 1 and 100),
  interview_type    public.interview_type not null default 'video',
  scheduled_at      timestamptz not null,
  duration_minutes  smallint check (duration_minutes between 5 and 600),
  meeting_link      text check (char_length(meeting_link) <= 2000),
  preparation_notes text check (char_length(preparation_notes) <= 5000),
  feedback          text check (char_length(feedback) <= 5000),
  result            public.interview_result not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, user_id),
  foreign key (application_id, user_id) references public.applications (id, user_id) on delete cascade
);

-- Global skill catalog used by the job match / skill gap analyzers (seeded in Phase 7).
create table public.skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  category   text not null check (char_length(category) between 1 and 40),
  aliases    text[] not null default '{}',   -- e.g. {'js','ecmascript'} for JavaScript
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_skills (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  skill_id   uuid not null references public.skills (id) on delete cascade,
  level      public.skill_level not null default 'beginner',
  progress   smallint not null default 0 check (progress between 0 and 100),
  is_learning_goal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table public.reminders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  application_id uuid,
  interview_id   uuid,
  type           public.reminder_type not null default 'custom',
  title          text not null check (char_length(title) between 1 and 150),
  notes          text check (char_length(notes) <= 2000),
  remind_at      timestamptz not null,
  is_completed   boolean not null default false,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  foreign key (application_id, user_id) references public.applications (id, user_id) on delete cascade,
  foreign key (interview_id, user_id) references public.interviews (id, user_id) on delete cascade
);

-- One subscription row per user (created with the profile). Changed only by the server.
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references public.profiles (id) on delete cascade,
  plan                 public.subscription_plan not null default 'free',
  status               public.subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Razorpay TEST MODE payments. Changed only by the server after signature verification.
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  subscription_id     uuid references public.subscriptions (id) on delete set null,
  plan                public.subscription_plan not null,
  amount              integer not null check (amount > 0),  -- smallest currency unit (paise)
  currency            char(3) not null default 'INR',
  status              public.payment_status not null default 'created',
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Global question bank (seeded in Phase 8).
create table public.interview_questions (
  id               uuid primary key default gen_random_uuid(),
  category         public.question_category not null,
  difficulty       public.question_difficulty not null,
  question         text not null check (char_length(question) between 5 and 1000),
  suggested_answer text not null check (char_length(suggested_answer) <= 5000),
  tags             text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.user_question_progress (
  user_id           uuid not null references public.profiles (id) on delete cascade,
  question_id       uuid not null references public.interview_questions (id) on delete cascade,
  status            public.practice_status not null default 'not_started',
  notes             text check (char_length(notes) <= 5000),
  last_practiced_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (user_id, question_id)
);


-- -----------------------------------------------------------------------------
-- 4. Indexes (speed up the queries the app runs most)
-- -----------------------------------------------------------------------------
create unique index companies_user_name_key on public.companies (user_id, lower(name));
create unique index skills_name_key on public.skills (lower(name));
create unique index resumes_one_default_per_user on public.resumes (user_id) where is_default;

create index applications_user_status_idx   on public.applications (user_id, status, position);
create index applications_user_applied_idx  on public.applications (user_id, applied_at desc);
create index applications_company_idx       on public.applications (company_id);
create index applications_resume_idx        on public.applications (resume_id);
create index interviews_user_scheduled_idx  on public.interviews (user_id, scheduled_at);
create index interviews_application_idx     on public.interviews (application_id);
create index resumes_user_idx               on public.resumes (user_id);
create index user_skills_skill_idx          on public.user_skills (skill_id);
create index reminders_user_open_idx        on public.reminders (user_id, remind_at) where not is_completed;
create index reminders_application_idx      on public.reminders (application_id);
create index reminders_interview_idx        on public.reminders (interview_id);
create index payments_user_created_idx      on public.payments (user_id, created_at desc);
create index payments_subscription_idx      on public.payments (subscription_id);
create index questions_category_idx         on public.interview_questions (category, difficulty);
create index question_progress_question_idx on public.user_question_progress (question_id);


-- -----------------------------------------------------------------------------
-- 5. updated_at triggers
-- -----------------------------------------------------------------------------
create trigger set_updated_at before update on public.profiles               for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.companies              for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.resumes                for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.applications           for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.interviews             for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.skills                 for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_skills            for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reminders              for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions          for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments               for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.interview_questions    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_question_progress for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 6. New-user setup: create profile + free subscription on sign-up,
--    and keep profiles.email in sync when the auth email changes.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer          -- runs with the owner's rights, so it can insert despite RLS
set search_path = ''      -- prevents search_path hijacking in security definer functions
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100)
  );

  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();


-- -----------------------------------------------------------------------------
-- 7. Admin check used by policies
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;


-- -----------------------------------------------------------------------------
-- 8. Row Level Security
--    `(select auth.uid())` is evaluated once per query instead of once per row.
-- -----------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.companies              enable row level security;
alter table public.resumes                enable row level security;
alter table public.applications           enable row level security;
alter table public.interviews             enable row level security;
alter table public.skills                 enable row level security;
alter table public.user_skills            enable row level security;
alter table public.reminders              enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.payments               enable row level security;
alter table public.interview_questions    enable row level security;
alter table public.user_question_progress enable row level security;

-- profiles: read and update your own row only. No insert/delete policies:
-- rows are created by the trigger and removed when the auth user is deleted.
create policy "Users can view own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Users may only change these profile columns — never role or email.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, headline, location, weekly_goal) on public.profiles to authenticated;

-- Personal data tables: full access to your own rows only.
create policy "Users manage own companies" on public.companies
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own resumes" on public.resumes
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own applications" on public.applications
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own interviews" on public.interviews
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own skills" on public.user_skills
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own reminders" on public.reminders
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own question progress" on public.user_question_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Billing: read-only for users. The server (secret key) bypasses RLS to write.
create policy "Users can view own subscription" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can view own payments" on public.payments
  for select to authenticated using (user_id = (select auth.uid()));

-- Catalogs: everyone signed in can read; only admins can change.
create policy "Signed-in users can read skills" on public.skills
  for select to authenticated using (true);
create policy "Admins can insert skills" on public.skills
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update skills" on public.skills
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete skills" on public.skills
  for delete to authenticated using ((select public.is_admin()));

create policy "Signed-in users can read questions" on public.interview_questions
  for select to authenticated using (true);
create policy "Admins can insert questions" on public.interview_questions
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update questions" on public.interview_questions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete questions" on public.interview_questions
  for delete to authenticated using ((select public.is_admin()));
