# JobTrack AI

A smart job application tracker and career management platform. Organize applications, track progress on a Kanban board, manage resumes, analyze job descriptions for missing skills, prepare for interviews, and monitor job-search performance — all from one dashboard.

> **Status:** In development — Phase 1 (project setup) complete.

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
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide icons |
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
│       ├── services/       # API client (fetch wrapper)
│       ├── types/          # Shared TypeScript types
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css       # Tailwind + design tokens
├── server/                 # Express REST API
│   └── src/
│       ├── config/         # Environment variables
│       ├── controllers/    # Request handlers
│       ├── middleware/     # 404 + error handling (auth later)
│       ├── routes/         # Route definitions
│       ├── types/          # Response types
│       ├── utils/
│       ├── app.ts          # Express app (no listen)
│       └── server.ts       # Starts the HTTP server
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

## Environment variables

See [`client/.env.example`](client/.env.example) and [`server/.env.example`](server/.env.example).
Real `.env` files are git-ignored and must never be committed. Only `VITE_`-prefixed variables reach the browser, so secrets (Supabase service-role key, Razorpay secret) live only in `server/.env`.

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
