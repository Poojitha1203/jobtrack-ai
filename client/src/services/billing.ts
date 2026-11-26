import { apiRequest } from './api.ts';
import type { BillingOverview, CheckoutOrder, Payment } from '../types/billing.ts';

// Lets the plan badge, sidebar and gated pages refresh right after an upgrade or downgrade.
const PLAN_CHANGED = 'jobtrack:plan-changed';

export const onPlanChanged = (callback: () => void) => {
  window.addEventListener(PLAN_CHANGED, callback);
  return () => window.removeEventListener(PLAN_CHANGED, callback);
};

const notifyPlanChanged = <T>(result: T) => {
  window.dispatchEvent(new Event(PLAN_CHANGED));
  return result;
};

export const getBillingOverview = () => apiRequest<BillingOverview>('/billing/overview');

export const listPayments = () => apiRequest<{ items: Payment[] }>('/billing/payments').then((r) => r.items);

export const createCheckoutOrder = () => apiRequest<CheckoutOrder>('/billing/orders', { method: 'POST' });

export const verifyPayment = (body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
  apiRequest<BillingOverview>('/billing/verify', { method: 'POST', body: JSON.stringify(body) }).then(notifyPlanChanged);

export const reportPaymentFailed = (razorpayOrderId: string) =>
  apiRequest<void>('/billing/failed', { method: 'POST', body: JSON.stringify({ razorpayOrderId }) });

export const setCancelAtPeriodEnd = (cancel: boolean) =>
  apiRequest<BillingOverview>('/billing/cancel', { method: 'POST', body: JSON.stringify({ cancel }) }).then(notifyPlanChanged);

export const downgradeNow = () =>
  apiRequest<BillingOverview>('/billing/downgrade', { method: 'POST' }).then(notifyPlanChanged);
