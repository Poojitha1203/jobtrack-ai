import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BriefcaseBusiness, RefreshCw, Sparkles, UserCheck, Users } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { StatCard } from '../../components/dashboard/StatCard.tsx';
import { ChartCard, DataTable } from '../../components/analytics/ChartCard.tsx';
import { ColumnChart, HorizontalBarChart } from '../../components/analytics/Charts.tsx';
import { Card, CardHeader } from '../../components/ui/Card.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';
import { getAdminOverview, listAdminPayments } from '../../services/admin.ts';
import { STATUS_META } from '../../lib/status.ts';
import { PAYMENT_STATUS, rupees } from '../../lib/billingFormat.ts';
import { formatDateTime } from '../../lib/format.ts';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import type { AdminOverview, AdminPayment } from '../../types/admin.ts';

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 tabular-nums">{children}</dd>
    </div>
  );
}

function SubscriptionCard({ subscriptions, payments }: Pick<AdminOverview, 'subscriptions' | 'payments'>) {
  const total = subscriptions.free + subscriptions.pro;
  const proShare = total > 0 ? (subscriptions.pro / total) * 100 : 0;
  return (
    <Card>
      <CardHeader title="Subscriptions" description="Razorpay test mode — no real money." />
      <div className="px-5 pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-600">
            <span className="font-semibold text-slate-900 tabular-nums">{subscriptions.pro}</span> Pro ·{' '}
            <span className="font-semibold text-slate-900 tabular-nums">{subscriptions.free}</span> Free
          </span>
          <span className="text-slate-500">{subscriptions.conversionRate}% on Pro</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${subscriptions.pro} of ${total} users on Pro`}
        >
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${proShare}%` }} />
        </div>
      </div>
      <dl className="divide-y divide-slate-100 px-5 pb-2">
        <Row label="Test revenue (paid)">{rupees(payments.revenuePaise)}</Row>
        <Row label="Paid payments">{payments.paid}</Row>
        <Row label="Failed payments">{payments.failed}</Row>
        <Row label="Checkouts not completed">{payments.pending}</Row>
        <Row label="Pro cancelling at period end">{subscriptions.cancelScheduled}</Row>
      </dl>
    </Card>
  );
}

function SystemCard({ system, activity }: Pick<AdminOverview, 'system' | 'activity'>) {
  return (
    <Card>
      <CardHeader title="System" description={`Checked ${formatDateTime(system.generatedAt)}`} />
      <dl className="mt-2 divide-y divide-slate-100 px-5 pb-2">
        <Row label="API">
          <Badge tone="success">Online</Badge>
        </Row>
        <Row label="Environment">{system.environment}</Row>
        <Row label="Node.js">{system.nodeVersion}</Row>
        <Row label="API uptime">{formatUptime(system.uptimeSeconds)}</Row>
        <Row label="Database response">
          <Badge tone={system.databaseLatencyMs < 500 ? 'success' : 'warning'}>{system.databaseLatencyMs} ms</Badge>
        </Row>
        <Row label="Test payments">
          <Badge tone={system.paymentsConfigured ? 'success' : 'warning'}>
            {system.paymentsConfigured ? 'Configured' : 'Not configured'}
          </Badge>
        </Row>
        <Row label="Interviews tracked">{activity.interviews.toLocaleString()}</Row>
        <Row label="Resumes uploaded">{activity.resumes.toLocaleString()}</Row>
      </dl>
    </Card>
  );
}

function RecentPayments({ items, error }: { items?: AdminPayment[]; error?: Error }) {
  return (
    <Card>
      <CardHeader
        title="Recent payments"
        description="Latest test checkouts across all users."
        action={
          <Link to="/admin/users" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            Manage users
          </Link>
        }
      />
      <div className="mt-4 overflow-x-auto">
        {error ? (
          <p className="px-5 pb-5 text-sm text-rose-600">{error.message}</p>
        ) : !items ? (
          <div className="space-y-2 px-5 pb-5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">No payments yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-2 font-medium">User</th>
                <th scope="col" className="px-5 py-2 font-medium">Date</th>
                <th scope="col" className="px-5 py-2 text-right font-medium">Amount</th>
                <th scope="col" className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="max-w-56 truncate px-5 py-3 text-slate-900">{p.userEmail}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDateTime(p.createdAt)}</td>
                  <td className="px-5 py-3 text-right text-slate-900 tabular-nums">{rupees(p.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export function AdminOverviewPage() {
  useDocumentTitle('Admin overview');
  const { data, error, loading, reload } = useAsyncData(getAdminOverview, 'admin-overview');
  const payments = useAsyncData(() => listAdminPayments(), 'admin-payments');

  const refresh = () => {
    reload();
    payments.reload();
  };

  const header = (
    <PageHeader
      title="Admin overview"
      description="Platform-wide numbers across every user. Only admins can see this page."
      actions={
        <Button variant="secondary" onClick={refresh} loading={loading && Boolean(data)}>
          <RefreshCw className="size-4" aria-hidden="true" /> Refresh
        </Button>
      }
    />
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Alert tone="error" title="Couldn't load the admin overview">
          {error.message}
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingState />
      </div>
    );
  }

  const { users, applications, subscriptions } = data;
  const statusRows = applications.byStatus.map((row) => ({ name: STATUS_META[row.status].label, count: row.count }));
  const hasSignups = data.signupsByMonth.some((m) => m.count > 0);

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={users.total.toLocaleString()} hint={`+${users.newLast30Days} in the last 30 days · ${users.admins} admin${users.admins === 1 ? '' : 's'}`} icon={Users} />
        <StatCard label="Active users" value={users.activeLast30Days.toLocaleString()} hint="Updated an application in the last 30 days" icon={UserCheck} accent="emerald" />
        <StatCard label="Applications" value={applications.total.toLocaleString()} hint={`+${applications.newLast30Days} in 30 days · ${applications.averagePerUser} per user`} icon={BriefcaseBusiness} accent="sky" />
        <StatCard label="Pro subscribers" value={subscriptions.pro.toLocaleString()} hint={`${subscriptions.conversionRate}% of users · ${subscriptions.cancelScheduled} cancelling`} icon={Sparkles} accent="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Sign-ups per month"
          description="New accounts over the last 12 months."
          empty={!hasSignups && 'No sign-ups in the last 12 months.'}
          table={<DataTable columns={['Month', 'Sign-ups']} rows={data.signupsByMonth.map((m) => [m.label, m.count])} />}
        >
          <ColumnChart data={data.signupsByMonth} xKey="label" valueKey="count" valueName="Sign-ups" />
        </ChartCard>
        <ChartCard
          title="Applications by status"
          description="Where every user's applications currently are."
          empty={applications.total === 0 && 'No applications yet.'}
          table={<DataTable columns={['Status', 'Applications']} rows={statusRows.map((r) => [r.name, r.count])} />}
        >
          <HorizontalBarChart data={statusRows} nameKey="name" valueKey="count" valueName="Applications" />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionCard subscriptions={subscriptions} payments={data.payments} />
        <SystemCard system={data.system} activity={data.activity} />
      </div>

      <RecentPayments items={payments.data?.items} error={payments.error} />
    </div>
  );
}
