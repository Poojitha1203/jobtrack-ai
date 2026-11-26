import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationSchema, updateApplicationSchema } from '../validators/application.schema.js';
import { updateProfileSchema } from '../validators/profile.schema.js';
import { listUsersQuerySchema, updateUserSchema } from '../validators/admin.schema.js';
import { verifyPaymentSchema } from '../validators/billing.schema.js';
import { escapeLike, parseId, sanitizeSearchTerm } from '../utils/parse.js';
import { fillMonths, percentOf } from '../lib/admin/overview.js';

const fails = (result: { success: boolean }) => assert.equal(result.success, false);

describe('mass assignment', () => {
  it('a user cannot set their own role through the profile endpoint', () => {
    fails(updateProfileSchema.safeParse({ fullName: 'Me', role: 'admin' }));
    fails(updateProfileSchema.safeParse({ email: 'other@example.com' }));
  });

  it('an application cannot be created for another user', () => {
    fails(createApplicationSchema.safeParse({ jobTitle: 'Dev', companyName: 'Acme', user_id: crypto.randomUUID() }));
    fails(updateApplicationSchema.safeParse({ userId: crypto.randomUUID() }));
  });

  it('the admin update accepts only role and plan', () => {
    fails(updateUserSchema.safeParse({ email: 'x@example.com' }));
    fails(updateUserSchema.safeParse({ role: 'superuser' }));
    fails(updateUserSchema.safeParse({}));
    assert.ok(updateUserSchema.safeParse({ role: 'admin' }).success);
  });
});

describe('injection and unsafe input', () => {
  it('ids must be UUIDs, so SQL or filter fragments become 404s', () => {
    for (const id of ["1' or '1'='1", '../../etc/passwd', '1;drop table profiles', 'abc']) {
      assert.throws(() => parseId(id), { status: 404 });
    }
  });

  it('search terms cannot inject PostgREST filter syntax', () => {
    const term = sanitizeSearchTerm('x*,role.eq.admin),(email.ilike.*');
    assert.doesNotMatch(term, /[,()*]/);
  });

  it('LIKE wildcards are escaped', () => {
    assert.equal(escapeLike('100%_off\\'), '100\\%\\_off\\\\');
  });

  it('job links must be http(s), blocking javascript: URLs', () => {
    fails(createApplicationSchema.safeParse({ jobTitle: 'Dev', companyName: 'Acme', jobUrl: 'javascript:alert(1)' }));
    fails(createApplicationSchema.safeParse({ jobTitle: 'Dev', companyName: 'Acme', jobUrl: 'data:text/html,<script>' }));
    assert.ok(createApplicationSchema.safeParse({ jobTitle: 'Dev', companyName: 'Acme', jobUrl: 'https://jobs.example.com/1' }).success);
  });

  it('oversized text is rejected', () => {
    fails(createApplicationSchema.safeParse({ jobTitle: 'x'.repeat(151), companyName: 'Acme' }));
    fails(listUsersQuerySchema.safeParse({ search: 'x'.repeat(101) }));
    fails(listUsersQuerySchema.safeParse({ pageSize: '1000' }));
  });

  it('payment verification only accepts well-formed Razorpay values', () => {
    const valid = { razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_XYZ789', razorpaySignature: 'a'.repeat(64) };
    assert.ok(verifyPaymentSchema.safeParse(valid).success);
    fails(verifyPaymentSchema.safeParse({ ...valid, razorpaySignature: 'not-a-signature' }));
    fails(verifyPaymentSchema.safeParse({ ...valid, razorpayOrderId: "order_1' or 1=1" }));
    fails(verifyPaymentSchema.safeParse({ ...valid, userId: crypto.randomUUID() }));
  });
});

describe('admin overview helpers', () => {
  it('fills missing months with zero, oldest first', () => {
    const months = fillMonths([{ month: '2026-11', count: 4 }, { month: '2026-09', count: 1 }], 3, new Date('2026-11-26T00:00:00Z'));
    assert.deepEqual(
      months.map((m) => [m.month, m.count]),
      [['2026-09', 1], ['2026-10', 0], ['2026-11', 4]],
    );
    assert.equal(months[2]?.label, 'Nov 26');
  });

  it('crosses a year boundary', () => {
    const months = fillMonths([], 3, new Date('2027-01-10T00:00:00Z'));
    assert.deepEqual(months.map((m) => m.month), ['2026-11', '2026-12', '2027-01']);
  });

  it('percentOf handles zero totals', () => {
    assert.equal(percentOf(1, 3), 33);
    assert.equal(percentOf(5, 0), 0);
  });
});
