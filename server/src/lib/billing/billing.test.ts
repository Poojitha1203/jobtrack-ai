import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { addDays, effectivePlan, type SubscriptionRow } from './plan.js';
import { verifyPaymentSignature } from './razorpay.js';

const now = new Date('2026-11-25T10:00:00Z');
const row = (overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 's1',
  plan: 'pro',
  status: 'active',
  current_period_start: '2026-11-01T00:00:00Z',
  current_period_end: '2026-12-01T00:00:00Z',
  cancel_at_period_end: false,
  ...overrides,
});

describe('effectivePlan', () => {
  it('is free without a subscription row', () => assert.equal(effectivePlan(null, now), 'free'));
  it('is pro during an active paid period', () => assert.equal(effectivePlan(row(), now), 'pro'));
  it('stays pro until the period ends even if cancelled at period end', () =>
    assert.equal(effectivePlan(row({ cancel_at_period_end: true }), now), 'pro'));
  it('falls back to free once the period has ended', () =>
    assert.equal(effectivePlan(row({ current_period_end: '2026-11-20T00:00:00Z' }), now), 'free'));
  it('is free for a free plan row', () => assert.equal(effectivePlan(row({ plan: 'free', current_period_end: null }), now), 'free'));
  it('is free when the status is not active', () => assert.equal(effectivePlan(row({ status: 'expired' }), now), 'free'));
});

describe('verifyPaymentSignature', () => {
  const secret = 'test_secret';
  const sign = (order: string, payment: string) => createHmac('sha256', secret).update(`${order}|${payment}`).digest('hex');

  it('accepts the signature Razorpay would produce', () => {
    assert.equal(verifyPaymentSignature('order_1', 'pay_1', sign('order_1', 'pay_1'), secret), true);
  });
  it('rejects a signature for a different order (tampered order id)', () => {
    assert.equal(verifyPaymentSignature('order_2', 'pay_1', sign('order_1', 'pay_1'), secret), false);
  });
  it('rejects a signature made with another secret', () => {
    const forged = createHmac('sha256', 'attacker').update('order_1|pay_1').digest('hex');
    assert.equal(verifyPaymentSignature('order_1', 'pay_1', forged, secret), false);
  });
  it('rejects malformed signatures without throwing', () => {
    assert.equal(verifyPaymentSignature('order_1', 'pay_1', 'short', secret), false);
  });
});

describe('addDays', () => {
  it('adds whole days', () => assert.equal(addDays(now, 30).toISOString(), '2026-12-25T10:00:00.000Z'));
});
