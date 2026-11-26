import { after, before, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rateLimit } from '../middleware/rateLimit.js';

// A fake, unreachable Supabase: no request in this file may ever reach a real project.
Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL: 'http://localhost:5173',
  SUPABASE_URL: 'http://127.0.0.1:9',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  SUPABASE_SECRET_KEY: '',
  RAZORPAY_KEY_ID: '',
  RAZORPAY_KEY_SECRET: '',
});

const ALLOWED_ORIGIN = 'http://localhost:5173';
const SOME_ID = '00000000-0000-4000-8000-000000000000';

let server: Server;
let base: string;
let requireAdmin: RequestHandler;

before(async () => {
  mock.method(console, 'warn', () => {});
  mock.method(console, 'error', () => {});
  const { default: app } = await import('../app.js');
  ({ requireAdmin } = await import('../middleware/requireAdmin.js'));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(() => {
  server.close();
});

const call = (path: string, init: RequestInit = {}) => fetch(`${base}${path}`, init);

const PROTECTED: [method: string, path: string][] = [
  ['GET', '/profile'],
  ['PATCH', '/profile'],
  ['GET', '/applications'],
  ['POST', '/applications'],
  ['DELETE', `/applications/${SOME_ID}`],
  ['GET', '/companies'],
  ['GET', '/interviews'],
  ['GET', '/reminders'],
  ['GET', '/resumes'],
  ['POST', '/job-match'],
  ['GET', '/skills/gap'],
  ['GET', '/interview-prep/questions'],
  ['GET', '/analytics'],
  ['GET', '/billing/overview'],
  ['POST', '/billing/orders'],
  ['POST', '/billing/verify'],
  ['POST', '/billing/downgrade'],
  ['GET', '/admin/overview'],
  ['GET', '/admin/users'],
  ['PATCH', `/admin/users/${SOME_ID}`],
  ['GET', '/admin/payments'],
];

const BAD_AUTH_HEADERS: [label: string, headers: Record<string, string>][] = [
  ['no Authorization header', {}],
  ['a non-Bearer scheme', { Authorization: 'Basic dXNlcjpwYXNz' }],
  ['an empty Bearer token', { Authorization: 'Bearer ' }],
  ['a forged token', { Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.' }],
];

describe('authentication on every protected endpoint', () => {
  for (const [label, headers] of BAD_AUTH_HEADERS) {
    it(`rejects ${label} with 401 on all ${PROTECTED.length} endpoints`, async () => {
      for (const [method, path] of PROTECTED) {
        const res = await call(path, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : '{}' });
        assert.equal(res.status, 401, `${method} ${path} returned ${res.status}`);
        const body = (await res.json()) as { error: { message: string } };
        assert.ok(body.error.message, `${method} ${path} has no error message`);
      }
    });
  }
});

describe('requireAdmin', () => {
  const fakeRequest = (result: { data: { role: string } | null; error: { message: string } | null }) => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => result };
    const supabase = { from: () => query } as unknown as SupabaseClient;
    return { auth: { userId: SOME_ID, email: 'user@example.com', supabase } } as Request;
  };
  const run = (req: Request) => {
    let passed = false;
    const next: NextFunction = () => {
      passed = true;
    };
    return Promise.resolve(requireAdmin(req, {} as Response, next)).then(() => passed);
  };

  it('blocks a normal user with 403', async () => {
    await assert.rejects(run(fakeRequest({ data: { role: 'user' }, error: null })), { status: 403 });
  });

  it('blocks a user with no profile row with 403', async () => {
    await assert.rejects(run(fakeRequest({ data: null, error: null })), { status: 403 });
  });

  it('fails closed when the role lookup errors', async () => {
    await assert.rejects(run(fakeRequest({ data: null, error: { message: 'timeout' } })), /Failed to check permissions/);
  });

  it('lets an admin through', async () => {
    assert.equal(await run(fakeRequest({ data: { role: 'admin' }, error: null })), true);
  });

  it('rejects a request that skipped requireAuth', async () => {
    await assert.rejects(run({} as Request), { status: 401 });
  });
});

describe('HTTP hardening', () => {
  it('sends security headers and hides the framework', async () => {
    const res = await call('/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('strict-transport-security'));
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });

  it('allows the frontend origin', async () => {
    const res = await call('/health', { headers: { Origin: ALLOWED_ORIGIN } });
    assert.equal(res.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
  });

  it('refuses other origins', async () => {
    const res = await call('/health', { headers: { Origin: 'https://evil.example' } });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });

  it('rejects malformed JSON with 400 and no stack trace', async () => {
    const res = await call('/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"jobTitle": ',
    });
    assert.equal(res.status, 400);
    const text = await res.text();
    assert.doesNotMatch(text, /node_modules|at .+\(.+:\d+:\d+\)/);
  });

  it('rejects bodies over 1 MB with 413', async () => {
    const res = await call('/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'x'.repeat(1_100_000) }),
    });
    assert.equal(res.status, 413);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await call('/does-not-exist');
    assert.equal(res.status, 404);
    assert.ok(((await res.json()) as { error: { message: string } }).error.message);
  });

  it('reports rate-limit headers', async () => {
    const res = await call('/health');
    assert.ok(Number(res.headers.get('ratelimit-limit')) > 0);
    assert.ok(res.headers.get('ratelimit-remaining'));
  });
});

describe('rateLimit', () => {
  const fakeRes = () => {
    const headers: Record<string, string> = {};
    return { headers, res: { setHeader: (name: string, value: string) => (headers[name] = value) } as unknown as Response };
  };

  it('blocks after the limit, per client, until the window resets', () => {
    mock.timers.enable({ apis: ['Date'], now: 0 });
    try {
      const limiter = rateLimit({ windowMs: 60_000, max: 2 });
      const { headers, res } = fakeRes();
      const a = { ip: '10.0.0.1' } as Request;
      const b = { ip: '10.0.0.2' } as Request;
      let passed = 0;
      const next = () => void passed++;

      limiter(a, res, next);
      limiter(a, res, next);
      assert.throws(() => limiter(a, res, next), { status: 429, code: 'RATE_LIMITED' });
      assert.equal(headers['Retry-After'], '60');

      limiter(b, res, next);
      mock.timers.tick(60_000);
      limiter(a, res, next);
      assert.equal(passed, 4);
    } finally {
      mock.timers.reset();
    }
  });
});
