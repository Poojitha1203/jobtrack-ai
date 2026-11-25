# JobTrack AI

A smart job application tracker and career management platform. Organize applications, track progress on a Kanban board, manage resumes, analyze job descriptions for missing skills, prepare for interviews, and monitor job-search performance — all from one dashboard.

> **Status:** In development — Phase 7 (resumes, job match analyzer, skill gap analyzer) complete.

## Features

Planned for v1.0.0:

- **Authentication** — register, login, logout, password reset, protected routes (Supabase Auth)
- **Dashboard** — application stats, response & interview conversion rates, activity chart, weekly goal
- **Application management** — CRUD, search, filters, sorting, notes, salary range, job URL
- **Kanban board** — drag-and-drop across Wishlist → Applied → Assessment → Interview → Offer → Rejected
- **Companies, interviews, calendar & reminders**
- **Resume manager** — PDF upload, text extraction, assign resumes to applications
- **Job match analyzer** — rule-based match score, matching / missing skills *(approximate, not an AI prediction)*
- **Skill gap analyzer** — learning priorities and progress tracking
- **Interview preparation** — categorized question bank with practice tracking
- **Career analytics** — charts for status, sources, success rate, in-demand skills
- **Subscriptions** — Free / Pro plan UI with **Razorpay Test Mode only** (no real payments)
- **Admin dashboard** — role-based access, user & system statistics

## Tech stack

| Layer      | Technology                                                |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4, React Router 7, Lucide icons |
| Backend    | Node.js, Express 5, TypeScript                            |
| Database   | Supabase PostgreSQL with Row Level Security               |
| Auth       | Supabase Auth                                             |
| Deployment | Vercel (free), Supabase (free)                            |

Every service used has a free tier sufficient for this project — no paid APIs are required.

## Project structure

```
jobtrack-ai/
├── client/                 # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── auth/       # ProtectedRoute, GuestRoute
│       │   ├── ui/         # Design system: Button, Card, Badge, TextField, Alert, ...
│       │   ├── layout/     # Sidebar, Topbar, Logo, PageHeader
│       │   └── dashboard/  # Dashboard widgets (stats, charts, lists)
│       ├── config/         # Navigation (single source for sidebar + routes)
│       ├── context/        # AuthProvider (session + profile)
│       ├── data/           # Temporary sample data (replaced in Phase 4)
│       ├── hooks/          # Reusable React hooks
│       ├── layouts/        # AppLayout, AuthLayout
│       ├── lib/            # Supabase client, helpers: dates, metrics, validation
│       ├── pages/          # Route-level pages
│       ├── services/       # API client (fetch wrapper)
│       ├── types/          # Shared TypeScript types
│       ├── router.tsx      # React Router route table
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css       # Tailwind + design tokens
├── server/                 # Express REST API
│   └── src/
│       ├── config/         # Environment variables
│       ├── controllers/    # Request handlers
│       ├── lib/            # Supabase client factory
│       ├── middleware/     # requireAuth, validateBody, 404 + error handling
│       ├── routes/         # Route definitions
│       ├── types/          # Response types, Express request typing
│       ├── utils/
│       ├── validators/     # zod request schemas
│       ├── app.ts          # Express app (no listen)
│       └── server.ts       # Starts the HTTP server
├── supabase/migrations/    # SQL schema, RLS policies, triggers
├── .github/                # Pull request template
└── package.json            # npm workspaces + root scripts
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **22.12 or newer** (LTS recommended)
- npm 10+ (bundled with Node)
- Git

### Installation

```bash
git clone https://github.com/Poojitha1203/jobtrack-ai.git
cd jobtrack-ai
npm install                                  # installs client + server dependencies
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Supabase setup (free plan)

1. Create a free account at [supabase.com](https://supabase.com) and a **New project** (pick the region closest to you, save the database password somewhere safe).
2. **SQL Editor → New query** → run each file in [`supabase/migrations/`](supabase/migrations/) **in filename order** (paste the whole file → **Run**, then the next file):
   1. `20261123000000_initial_schema.sql` — tables, constraints, triggers, Row Level Security
   2. `20261123000100_data_api_grants.sql` — explicit API privileges (required on Supabase projects created after May 2026, which no longer expose new tables automatically)
   3. `20261124000000_application_list_view.sql` — applications joined with company names, for search and sorting
   4. `20261125000000_move_application_function.sql` — saves Kanban moves (status + card order) in one transaction
   5. `20261126000000_resume_storage.sql` — private `resumes` storage bucket (PDF, 5 MB max) with per-user folder policies
   6. `20261127000000_seed_skills.sql` — catalog of 123 skills (with aliases) used by the job match analyzer
3. **Authentication → Sign In / Providers → Email**: for local development turn **Confirm email** off (see the email note below).
4. **Authentication → URL Configuration**: set **Site URL** to `http://localhost:5173` and add `http://localhost:5173/**` under **Redirect URLs**.
5. **Project Settings → API Keys**: copy the **Project URL** and the **publishable key** (`sb_publishable_…`) into both `client/.env` and `server/.env`.

> **Free-tier notes:** 500 MB database, 1 GB file storage, 50,000 monthly active users, 2 active projects. Projects **pause after 1 week of inactivity** (resume from the dashboard; data is kept).
> Storage: 1 GB total, 50 MB max per file (this app limits resumes to 5 MB), 5 GB egress per month.
> Supabase's built-in email sends only **to your project team's addresses** and only about **2 emails per hour**. That's enough to test password reset with your own email. For real users, connect a free SMTP provider in **Authentication → Emails → SMTP Settings**.

To make yourself an admin (needed in Phase 11), run in the SQL Editor:
`update public.profiles set role = 'admin' where email = 'you@example.com';`

### Run locally

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API health check: <http://localhost:4000/api/health>

In development, Vite proxies `/api/*` requests to the Express server, so the frontend uses relative URLs.

### Scripts (run from the project root)

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start client and server together         |
| `npm run dev:client` | Start only the frontend                  |
| `npm run dev:server` | Start only the API (auto-restarts)       |
| `npm run build`      | Type-check and build the frontend        |
| `npm run lint`       | Lint the frontend                        |
| `npm test -w server` | Run server unit tests (Node test runner) |

## REST API

All endpoints except `/api/health` require `Authorization: Bearer <Supabase access token>`.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/health` | API status |
| GET / PATCH | `/api/profile` | Current user's profile |
| GET | `/api/applications` | List with `search`, `status`, `companyId`, `location`, `jobType`, `workMode`, `appliedFrom`, `appliedTo`, `sort`, `order`, `page`, `pageSize` |
| GET | `/api/applications/summary` | All applications (for dashboard statistics) |
| POST | `/api/applications` | Create (company is found or created by name) |
| GET / PATCH / DELETE | `/api/applications/:id` | Read, update, delete one application |
| PATCH | `/api/applications/:id/move` | Kanban move: `{ status, orderedIds, appliedAt? }` |
| GET / POST | `/api/companies` | List (with `search` and application counts) / create |
| GET / PATCH / DELETE | `/api/companies/:id` | Read, update, delete (blocked while it has applications) |
| GET / POST | `/api/interviews` | List (`from`, `to`, `applicationId`, `result`, `order`, `limit`) / schedule |
| GET / PATCH / DELETE | `/api/interviews/:id` | Read, update, delete one interview |
| GET / POST | `/api/reminders` | List (`status=open\|completed\|all`, `from`, `to`, `applicationId`) / create |
| PATCH / DELETE | `/api/reminders/:id` | Update (including `isCompleted`) or delete a reminder |
| GET / POST | `/api/resumes` | List / register an uploaded PDF (file goes directly to Supabase Storage) |
| PATCH / DELETE | `/api/resumes/:id` | Rename, set default, or delete (also removes the stored file) |
| POST | `/api/job-match/analyze` | Rule-based match of a resume against a job description |
| GET | `/api/skills` | Skill catalog |
| GET | `/api/skills/mine` | Your saved skills (level, progress, learning goal) |
| PUT / DELETE | `/api/skills/mine/:skillId` | Add or update / remove one of your skills |
| GET | `/api/skills/gap` | Skill demand across your saved job descriptions and your learning priorities |

## How the job match score works

The match score is **approximate and rule-based — not an AI prediction**.

1. Skills from a catalog of 123 (with aliases such as `react.js` → React) are found in the job description using whole-term matching, so "Java" is not found inside "JavaScript".
2. Lines under headings like *Nice to have* or phrases like *is a plus* mark skills as **preferred**; others are **required**. *About us* and *Benefits* sections are ignored.
3. Each skill gets a weight (required 3, preferred 1, +0.5 per extra mention, max +1).
4. Score = weight of skills found in your resume or saved skills ÷ total weight × 100.

### Skill gap priorities

Every saved job description is scanned with the same engine. A skill you don't have yet is **high** priority when at least 40% of your jobs mention it or 3+ require it, **medium** at 20% or when at least one job requires it, otherwise **low**. Skills saved in *My skills* or found in your default resume count as "have".

## Environment variables

See [`client/.env.example`](client/.env.example) and [`server/.env.example`](server/.env.example).
Real `.env` files are git-ignored and must never be committed. Only `VITE_`-prefixed variables reach the browser, so secrets (Supabase secret key, Razorpay secret) live only in `server/.env`.

## Screenshots

_Coming soon._

## Deployment

_Documented in Phase 12_ (Vercel for the frontend and API, Supabase for the database).

## Git workflow

- `main` — stable, production-ready releases
- `dev` — integration branch; all feature PRs target `dev`
- `feature/*`, `bugfix/*` — created from `dev`
- `hotfix/*` — created from `main` for critical fixes

## License

[MIT](LICENSE)
