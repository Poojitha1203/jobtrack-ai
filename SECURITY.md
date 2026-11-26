# Security

How JobTrack AI protects user data, and how to verify it.

## Security model

| Layer | Protection |
| ----- | ---------- |
| Browser | Holds only the Supabase **publishable** key and the user's own session. No secrets (`VITE_` variables only). Admin pages are hidden from non-admins, but this is cosmetic — the API enforces access. |
| API (Express) | `requireAuth` validates the Supabase token with Supabase Auth on every request. `requireAdmin` reads the role from the database on every `/api/admin` request, so revoking admin takes effect immediately. |
| Database (Postgres) | Row Level Security on every table. Normal requests use the user's own token, so RLS applies even if an API bug forgot a filter. Composite foreign keys stop linking another user's company or resume. |
| Privileged writes | Subscriptions, payments, roles and admin reports use the **secret key** on the server only, and only after the checks above. |

### Who can do what

| Data | Owner | Other users | Admins (via API) | Logged-out |
| ---- | ----- | ----------- | ---------------- | ---------- |
| Applications, companies, interviews, reminders, resumes, skills, practice progress | read / write | — | counts only | — |
| Profile | read; edit name, headline, location, goal | — | read, change role | — |
| Role | read | — | change (not their own) | — |
| Subscription, payments | read | — | read, grant / revoke Pro | — |
| Skill and question catalogs | read | read | write | — |

## Controls

- **Authentication:** Supabase Auth (bcrypt-hashed passwords, short-lived JWTs with refresh). Every `/api` route except `/api/health` returns `401` without a valid token.
- **Authorization:** RLS policies plus column privileges (`profiles.role` and `email` can't be updated by users). Admin endpoints return `403` for non-admins. Admins can't remove their own admin role, so the last admin can't lock themselves out.
- **Input validation:** strict zod schemas reject unknown fields (no mass assignment such as `role` or `user_id`), limit lengths, allow only `http(s)` links, require UUID ids, and strip PostgREST filter syntax from search terms.
- **Payments:** Razorpay **test keys only** (`rzp_test_`, enforced at startup). The server verifies `HMAC-SHA256(order_id|payment_id)` with a constant-time compare, using the order ID from its own database for the signed-in user. Verification is idempotent.
- **Files:** the `resumes` bucket is private, accepts only PDF up to 5 MB, and each user can access only their own folder.
- **HTTP hardening:** helmet security headers, CORS allow-list (`CLIENT_URL`), 1 MB JSON body limit, `Cache-Control: no-store` on API responses.
- **Rate limiting:** 600 requests / 15 min per IP across the API; 10 / min per user for payment calls; 30 / min per admin for user changes. The limiter is in memory, so on serverless hosting each instance counts separately — treat it as abuse protection, not a hard quota.
- **Error handling:** one JSON error format; in production, 5xx messages are replaced with "Internal server error" so stack traces and SQL never leak.
- **Secrets:** `.env` files are git-ignored; `.env.example` files contain placeholders only. A publishable key in the secret-key slot is rejected at startup.

## Automated tests

```bash
npm test -w server
```

`server/src/tests/security.test.ts` starts the real Express app against an unreachable fake Supabase and checks:

- 21 protected endpoints (including every admin route) return `401` with no token, a non-Bearer scheme, an empty token and a forged token
- `requireAdmin` blocks normal users, users with no profile and failed lookups, and lets admins through
- security headers, no `X-Powered-By`, CORS allow / deny, malformed JSON → `400` without a stack trace, oversized body → `413`, JSON `404`
- the rate limiter blocks per client and resets after the window

`server/src/tests/inputValidation.test.ts` covers mass assignment, SQL / filter injection attempts, `javascript:` links, oversized input and malformed payment values. `server/src/lib/billing/billing.test.ts` covers tampered payment signatures.

## Database checks

Run [`supabase/tests/security_checks.sql`](supabase/tests/security_checks.sql) in the Supabase SQL Editor. It is read-only and should return **no rows**. It flags tables without RLS, admin views exposed to users, writable `role` / `email` columns, billing tables writable by users, anything granted to logged-out visitors, `SECURITY DEFINER` functions without a fixed `search_path`, and a public resume bucket.

## Manual checks (two accounts)

Use two browsers (or a normal and a private window) with users **A** and **B**.

1. **Data isolation:** A creates an application and opens it; copy its URL (`/applications/<id>`). Open the URL as B → "Application not found".
2. **API isolation:** as B, in DevTools → Network, copy B's `Authorization` header and call `GET /api/applications/<A's id>` → `404`. `PATCH` and `DELETE` with the same id → `404`, and A's application is unchanged.
3. **Role escalation:** as B, `PATCH /api/profile` with `{"role":"admin"}` → `400` (unknown field). The Supabase Data API also refuses: column privileges don't allow updating `role`.
4. **Admin access:** as B (not admin), open `/admin` → redirected to the dashboard; `GET /api/admin/users` → `403`.
5. **Admin actions:** make A an admin with SQL. A opens **Admin → Users**: can grant B Pro and make B admin; A's own **Remove admin** button is disabled, and the API refuses with `400`.
6. **Revocation:** A removes B's admin role; B's next `/api/admin` request returns `403` without logging out.
7. **Payments:** start checkout and close it, then call `POST /api/billing/verify` with that `order_…` id, any `pay_…` id and a made-up 64-hex signature → `400` "Payment verification failed"; the plan stays Free. Another user's order id → `404`.
8. **Rate limit:** call `POST /api/billing/orders` more than 10 times in a minute → `429` with a `Retry-After` header.

## Reporting a vulnerability

This is a portfolio project. If you find a security issue, please open a private security advisory on GitHub instead of a public issue.
