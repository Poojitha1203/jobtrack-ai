import type { SupabaseClient } from '@supabase/supabase-js';
import { env, paymentsEnabled } from '../config/env.js';
import { PLANS } from '../constants/plans.js';
import { getAdminClient } from '../lib/supabase.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../lib/billing/razorpay.js';
import { addDays, effectivePlan } from '../lib/billing/plan.js';
import { countRows, getSubscriptionRow } from './plan.service.js';
import { HttpError } from '../utils/HttpError.js';
import type { BillingOverviewResponse, CheckoutOrderResponse, PaymentResponse } from '../types/api.js';
import type { VerifyPaymentInput } from '../validators/billing.schema.js';

const CURRENCY = 'INR';

function requirePayments() {
  if (!paymentsEnabled || !env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new HttpError(
      503,
      'Test payments are not configured. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and SUPABASE_SECRET_KEY to server/.env.',
    );
  }
  return { keyId: env.razorpayKeyId, keySecret: env.razorpayKeySecret };
}

export async function getBillingOverview(supabase: SupabaseClient): Promise<BillingOverviewResponse> {
  const [row, applications, resumes] = await Promise.all([
    getSubscriptionRow(supabase),
    countRows(supabase, 'applications'),
    countRows(supabase, 'resumes'),
  ]);
  const plan = effectivePlan(row);
  const expired = row?.plan === 'pro' && plan === 'free';

  return {
    plan,
    subscription: row
      ? {
          status: expired ? 'expired' : row.status,
          currentPeriodStart: row.current_period_start,
          currentPeriodEnd: row.current_period_end,
          cancelAtPeriodEnd: row.cancel_at_period_end,
        }
      : null,
    limits: PLANS[plan].limits,
    usage: { applications, resumes },
    plans: Object.values(PLANS).map((p) => ({ id: p.id, name: p.name, pricePaise: p.pricePaise, periodDays: p.periodDays, limits: p.limits })),
    payments: { enabled: paymentsEnabled, testMode: true, keyId: env.razorpayKeyId ?? null },
  };
}

export async function createCheckoutOrder(supabase: SupabaseClient, userId: string): Promise<CheckoutOrderResponse> {
  const credentials = requirePayments();
  const row = await getSubscriptionRow(supabase);
  if (effectivePlan(row) === 'pro' && !row?.cancel_at_period_end) {
    throw new HttpError(409, 'You are already on the Pro plan.');
  }

  const pro = PLANS.pro;
  const order = await createRazorpayOrder(credentials, {
    amount: pro.pricePaise,
    currency: CURRENCY,
    receipt: `jt_${userId.slice(0, 8)}_${Date.now()}`,
    notes: { user_id: userId, plan: pro.id },
  });

  const { error } = await getAdminClient().from('payments').insert({
    user_id: userId,
    subscription_id: row?.id ?? null,
    plan: pro.id,
    amount: order.amount,
    currency: order.currency,
    status: 'created',
    razorpay_order_id: order.id,
  });
  if (error) throw new Error(`Failed to record the order: ${error.message}`);

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: credentials.keyId, planName: pro.name };
}

export async function verifyCheckoutPayment(supabase: SupabaseClient, userId: string, input: VerifyPaymentInput) {
  const { keySecret } = requirePayments();
  const admin = getAdminClient();

  // Look the order up in OUR database, scoped to this user — never trust the browser's copy alone.
  const { data: payment, error } = await admin
    .from('payments')
    .select('id, status, amount, razorpay_order_id, razorpay_payment_id')
    .eq('razorpay_order_id', input.razorpayOrderId)
    .eq('user_id', userId)
    .maybeSingle<{ id: string; status: string; amount: number; razorpay_order_id: string; razorpay_payment_id: string | null }>();
  if (error) throw new Error(`Failed to load the order: ${error.message}`);
  if (!payment) throw new HttpError(404, 'Order not found');

  if (payment.status === 'paid' && payment.razorpay_payment_id === input.razorpayPaymentId) {
    return getBillingOverview(supabase); // already processed (e.g. the user retried) — idempotent
  }

  if (!verifyPaymentSignature(payment.razorpay_order_id, input.razorpayPaymentId, input.razorpaySignature, keySecret)) {
    throw new HttpError(400, 'Payment verification failed. You have not been upgraded.');
  }

  const now = new Date();
  const { error: payError } = await admin
    .from('payments')
    .update({ status: 'paid', razorpay_payment_id: input.razorpayPaymentId })
    .eq('id', payment.id);
  if (payError) throw new Error(`Failed to record the payment: ${payError.message}`);

  const { error: subError } = await admin
    .from('subscriptions')
    .update({
      plan: 'pro',
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: addDays(now, PLANS.pro.periodDays).toISOString(),
      cancel_at_period_end: false,
    })
    .eq('user_id', userId);
  if (subError) throw new Error(`Failed to upgrade the subscription: ${subError.message}`);

  return getBillingOverview(supabase);
}

export async function markPaymentFailed(userId: string, orderId: string): Promise<void> {
  requirePayments();
  const { error } = await getAdminClient()
    .from('payments')
    .update({ status: 'failed' })
    .eq('razorpay_order_id', orderId)
    .eq('user_id', userId)
    .eq('status', 'created');
  if (error) throw new Error(`Failed to update the payment: ${error.message}`);
}

/** Simulated cancel: keep Pro until the paid period ends, then drop to Free. */
export async function setCancelAtPeriodEnd(supabase: SupabaseClient, userId: string, cancel: boolean) {
  const row = await getSubscriptionRow(supabase);
  if (effectivePlan(row) !== 'pro') throw new HttpError(409, 'You are not on an active Pro plan.');
  const { error } = await getAdminClient().from('subscriptions').update({ cancel_at_period_end: cancel }).eq('user_id', userId);
  if (error) throw new Error(`Failed to update the subscription: ${error.message}`);
  return getBillingOverview(supabase);
}

/** Simulated immediate downgrade (useful when testing — no refund in test mode). */
export async function downgradeNow(supabase: SupabaseClient, userId: string) {
  const { error } = await getAdminClient()
    .from('subscriptions')
    .update({ plan: 'free', status: 'active', current_period_end: null, cancel_at_period_end: false })
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to downgrade: ${error.message}`);
  return getBillingOverview(supabase);
}

export async function listPayments(supabase: SupabaseClient): Promise<PaymentResponse[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, plan, amount, currency, status, razorpay_order_id, razorpay_payment_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to load payments: ${error.message}`);
  return data.map((p) => ({
    id: p.id,
    plan: p.plan,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    orderId: p.razorpay_order_id,
    paymentId: p.razorpay_payment_id,
    createdAt: p.created_at,
  }));
}
