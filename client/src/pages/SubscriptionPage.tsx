import { useState, type ReactNode } from 'react';
import { CircleCheck, CircleMinus, CreditCard, FlaskConical, Receipt } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { usePlan } from '../hooks/usePlan.ts';
import { useToast } from '../hooks/useToast.ts';
import {
  createCheckoutOrder,
  downgradeNow,
  getBillingOverview,
  listPayments,
  reportPaymentFailed,
  setCancelAtPeriodEnd,
  verifyPayment,
} from '../services/billing.ts';
import { CheckoutClosedError, openRazorpayCheckout } from '../lib/razorpayCheckout.ts';
import { getDisplayName } from '../lib/user.ts';
import { formatDateTime } from '../lib/format.ts';
import { cn } from '../lib/cn.ts';
import { PAYMENT_STATUS, rupees } from '../lib/billingFormat.ts';
import type { BillingOverview, PlanLimits } from '../types/billing.ts';

const longDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function features(limits: PlanLimits): { text: string; included: boolean }[] {
  return [
    { text: limits.applications === null ? 'Unlimited applications' : `Up to ${limits.applications} applications`, included: true },
    { text: 'Kanban board, companies, interviews & reminders', included: true },
    { text: 'Basic job match analysis', included: true },
    { text: limits.resumes === null ? 'Unlimited resume versions' : `${limits.resumes} resume`, included: true },
    { text: limits.analyticsMonths === null ? 'Advanced analytics (any time range)' : `Analytics for the last ${limits.analyticsMonths} months`, included: true },
    { text: limits.interviewDifficulties === null ? 'All interview questions + practice mode' : 'Easy interview questions only', included: limits.interviewDifficulties === null },
    { text: limits.skillGapPriorities === null ? 'Advanced skill gap analysis' : `Top ${limits.skillGapPriorities} skill gaps`, included: limits.skillGapPriorities === null },
  ];
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900 tabular-nums">{limit === null ? `${used} · unlimited` : `${used} / ${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-rose-500' : 'bg-brand-600')} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function CurrentPlan({ billing }: { billing: BillingOverview }) {
  const sub = billing.subscription;
  const isPro = billing.plan === 'pro';
  let statusBadge: ReactNode = <Badge tone="success">Active</Badge>;
  let detail = isPro ? '' : 'Free forever — upgrade any time.';
  if (isPro && sub?.currentPeriodEnd) {
    detail = sub.cancelAtPeriodEnd
      ? `Pro until ${longDate.format(new Date(sub.currentPeriodEnd))}, then back to Free.`
      : `Renews (test mode) on ${longDate.format(new Date(sub.currentPeriodEnd))}.`;
    if (sub.cancelAtPeriodEnd) statusBadge = <Badge tone="warning">Cancels at period end</Badge>;
  }
  if (sub?.status === 'expired') {
    statusBadge = <Badge tone="neutral">Pro expired</Badge>;
    detail = 'Your Pro period ended, so you are back on Free.';
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('flex size-11 items-center justify-center rounded-xl', isPro ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>
          <CreditCard className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">Current plan</p>
          <p className="text-xl font-semibold text-slate-900">{isPro ? 'Pro' : 'Free'}</p>
        </div>
        {statusBadge}
      </div>
      {detail && <p className="mt-3 text-sm text-slate-600">{detail}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Meter label="Applications" used={billing.usage.applications} limit={billing.limits.applications} />
        <Meter label="Resumes" used={billing.usage.resumes} limit={billing.limits.resumes} />
      </div>
    </Card>
  );
}

export function SubscriptionPage() {
  useDocumentTitle('Subscription');
  const showToast = useToast();
  const { profile, user } = useAuth();
  const plan = usePlan();
  const overview = useAsyncData(getBillingOverview, 'subscription-overview');
  const billing = overview.data ?? plan.billing;
  const payments = useAsyncData(listPayments, 'billing-payments');
  const [busy, setBusy] = useState<'upgrade' | 'cancel' | 'resume' | 'downgrade' | null>(null);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);

  const refresh = () => {
    overview.reload();
    plan.reload();
    payments.reload();
  };

  const upgrade = async () => {
    setBusy('upgrade');
    let orderId: string | null = null;
    try {
      const order = await createCheckoutOrder();
      orderId = order.orderId;
      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        description: `${order.planName} plan · 30 days (TEST MODE — no real charge)`,
        prefill: { name: getDisplayName(profile, user), email: profile?.email ?? user?.email ?? undefined },
        onAttemptFailed: (reason) => showToast(`Test payment failed: ${reason}. You can retry or close the checkout.`, 'error'),
      });
      await verifyPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });
      showToast('Payment verified — welcome to Pro! 🎉');
    } catch (error) {
      if (error instanceof CheckoutClosedError) {
        if (orderId) await reportPaymentFailed(orderId).catch(() => undefined);
        showToast('Checkout closed — you have not been charged.', 'info');
      } else {
        showToast(error instanceof Error ? error.message : 'Upgrade failed', 'error');
      }
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const run = async (kind: 'cancel' | 'resume' | 'downgrade', action: () => Promise<unknown>, message: string) => {
    setBusy(kind);
    try {
      await action();
      showToast(message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Something went wrong', 'error');
    } finally {
      setBusy(null);
      setConfirmDowngrade(false);
      refresh();
    }
  };

  if (!billing) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading subscription">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const isPro = billing.plan === 'pro';
  const cancelling = Boolean(billing.subscription?.cancelAtPeriodEnd);

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription" description="Compare plans, upgrade with a test payment, and see your payment history." />

      <Alert tone="info" title="Razorpay Test Mode — no real money">
        Every payment here is a test. In the checkout, pay with UPI ID <strong>success@razorpay</strong> (or <strong>failure@razorpay</strong> to
        test a failed payment), or use one of Razorpay's test cards and choose <strong>Success</strong> on the mock bank page.
      </Alert>

      {!billing.payments.enabled && (
        <Alert tone="warning" title="Test payments aren't set up on the server yet">
          Add <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code> (test keys) and <code>SUPABASE_SECRET_KEY</code> to{' '}
          <code>server/.env</code>, then restart the server.
        </Alert>
      )}

      <CurrentPlan billing={billing} />

      <div className="grid gap-6 md:grid-cols-2">
        {billing.plans.map((plan) => {
          const current = plan.id === billing.plan;
          const highlighted = plan.id === 'pro';
          return (
            <Card key={plan.id} className={cn('flex flex-col p-6', highlighted && 'ring-2 ring-brand-600')}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                {current && <Badge tone="brand">Current plan</Badge>}
              </div>
              <p className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">{rupees(plan.pricePaise)}</span>
                <span className="text-sm text-slate-500">{plan.pricePaise ? ' / 30 days (test)' : ' forever'}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {features(plan.limits).map((f) => (
                  <li key={f.text} className={cn('flex gap-2', f.included ? 'text-slate-700' : 'text-slate-400')}>
                    {f.included ? (
                      <CircleCheck className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
                    ) : (
                      <CircleMinus className="size-5 shrink-0 text-slate-300" aria-hidden="true" />
                    )}
                    <span>
                      {f.text}
                      {!f.included && <span className="sr-only"> (not included)</span>}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2">
                {plan.id === 'pro' && !isPro && (
                  <Button className="w-full" onClick={() => void upgrade()} loading={busy === 'upgrade'} disabled={!billing.payments.enabled}>
                    <FlaskConical className="size-4" aria-hidden="true" /> Upgrade with a test payment
                  </Button>
                )}
                {plan.id === 'pro' && isPro && !cancelling && (
                  <Button variant="secondary" className="w-full" loading={busy === 'cancel'} onClick={() => void run('cancel', () => setCancelAtPeriodEnd(true), 'Pro will end at the end of this period.')}>
                    Cancel at period end
                  </Button>
                )}
                {plan.id === 'pro' && isPro && cancelling && (
                  <Button variant="secondary" className="w-full" loading={busy === 'resume'} onClick={() => void run('resume', () => setCancelAtPeriodEnd(false), 'Pro will keep renewing.')}>
                    Keep Pro
                  </Button>
                )}
                {plan.id === 'free' && isPro && (
                  <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDowngrade(true)}>
                    Downgrade to Free now (test)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Payment history" description="Test payments only" />
        {payments.error && <Alert tone="error" className="m-5">{payments.error.message}</Alert>}
        {!payments.data && !payments.error && <Skeleton className="m-5 h-16" />}
        {payments.data?.length === 0 && <EmptyState icon={Receipt} title="No payments yet" description="Your test payments will appear here." />}
        {payments.data && payments.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="mt-4 w-full min-w-[34rem] text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Date</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Plan</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.data.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-700">{formatDateTime(p.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-700 capitalize">{p.plan}</td>
                    <td className="px-5 py-3 text-right text-slate-900 tabular-nums">{rupees(p.amount)}</td>
                    <td className="px-5 py-3"><Badge tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.paymentId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDowngrade}
        title="Downgrade to Free now?"
        message="This simulates an immediate downgrade for testing. Free plan limits apply right away; your data is kept. Test payments are not refunded (no real money was taken)."
        confirmLabel="Downgrade now"
        loading={busy === 'downgrade'}
        onConfirm={() => void run('downgrade', downgradeNow, 'You are now on the Free plan.')}
        onCancel={() => setConfirmDowngrade(false)}
      />
    </div>
  );
}
