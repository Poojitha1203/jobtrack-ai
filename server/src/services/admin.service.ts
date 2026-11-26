import { env, paymentsEnabled } from '../config/env.js';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../constants/application.js';
import { PLANS } from '../constants/plans.js';
import { getAdminClient } from '../lib/supabase.js';
import { addDays } from '../lib/billing/plan.js';
import { fillMonths, percentOf } from '../lib/admin/overview.js';
import { HttpError } from '../utils/HttpError.js';
import { sanitizeSearchTerm } from '../utils/parse.js';
import type {
  AdminOverviewResponse,
  AdminPaymentResponse,
  AdminUserResponse,
  PaginatedResponse,
  UserRole,
} from '../types/api.js';
import type { ListAdminPaymentsQuery, ListUsersQuery, UpdateUserInput } from '../validators/admin.schema.js';

// Every function here uses the secret-key client, which bypasses RLS.
// They must only be reached through routes guarded by requireAuth + requireAdmin.

type CountQuery = PromiseLike<{ count: number | null; error: { message: string } | null }>;
type RowsQuery<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

const HEAD = { count: 'exact', head: true } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

async function count(query: CountQuery, what: string) {
  const { count, error } = await query;
  if (error) throw new Error(`Failed to count ${what}: ${error.message}`);
  return count ?? 0;
}

async function rows<T>(query: RowsQuery<T>, what: string) {
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load ${what}: ${error.message}`);
  return data ?? [];
}

async function timed<T>(work: () => Promise<T>) {
  const start = performance.now();
  const result = await work();
  return { result, ms: Math.round(performance.now() - start) };
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const db = getAdminClient();
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [
    { result: totalUsers, ms: databaseLatencyMs },
    newUsers,
    activeUsers,
    admins,
    pro,
    cancelScheduled,
    totalApplications,
    newApplications,
    interviews,
    resumes,
    statusRows,
    signupRows,
    paymentRows,
  ] = await Promise.all([
    timed(() => count(db.from('profiles').select('id', HEAD), 'users')),
    count(db.from('profiles').select('id', HEAD).gte('created_at', since), 'new users'),
    count(db.from('admin_user_list').select('id', HEAD).gte('last_activity_at', since), 'active users'),
    count(db.from('profiles').select('id', HEAD).eq('role', 'admin'), 'admins'),
    count(db.from('admin_user_list').select('id', HEAD).eq('plan', 'pro'), 'pro users'),
    count(db.from('admin_user_list').select('id', HEAD).eq('plan', 'pro').eq('cancel_at_period_end', true), 'cancellations'),
    count(db.from('applications').select('id', HEAD), 'applications'),
    count(db.from('applications').select('id', HEAD).gte('created_at', since), 'new applications'),
    count(db.from('interviews').select('id', HEAD), 'interviews'),
    count(db.from('resumes').select('id', HEAD), 'resumes'),
    rows(db.from('admin_application_status_counts').select('status, count').returns<{ status: ApplicationStatus; count: number }[]>(), 'status counts'),
    rows(db.from('admin_signups_by_month').select('month, count').returns<{ month: string; count: number }[]>(), 'signups'),
    rows(db.from('admin_payment_totals').select('status, count, amount').returns<{ status: string; count: number; amount: number }[]>(), 'payment totals'),
  ]);

  const statusCounts = new Map(statusRows.map((row) => [row.status, row.count]));
  const payment = (status: string) => paymentRows.find((row) => row.status === status);

  return {
    users: { total: totalUsers, newLast30Days: newUsers, activeLast30Days: activeUsers, admins },
    applications: {
      total: totalApplications,
      newLast30Days: newApplications,
      averagePerUser: totalUsers > 0 ? Math.round((totalApplications / totalUsers) * 10) / 10 : 0,
      byStatus: APPLICATION_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
    },
    activity: { interviews, resumes },
    subscriptions: {
      free: totalUsers - pro,
      pro,
      cancelScheduled,
      conversionRate: percentOf(pro, totalUsers),
    },
    payments: {
      paid: payment('paid')?.count ?? 0,
      failed: payment('failed')?.count ?? 0,
      pending: payment('created')?.count ?? 0,
      revenuePaise: Number(payment('paid')?.amount ?? 0),
      currency: 'INR',
    },
    signupsByMonth: fillMonths(signupRows, 12),
    system: {
      environment: env.nodeEnv,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      databaseLatencyMs,
      paymentsConfigured: paymentsEnabled,
      generatedAt: new Date().toISOString(),
    },
  };
}

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plan: 'free' | 'pro';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  application_count: number;
  last_activity_at: string | null;
  created_at: string;
}

const USER_COLUMNS =
  'id, email, full_name, role, plan, current_period_end, cancel_at_period_end, application_count, last_activity_at, created_at';

const toUser = (row: AdminUserRow): AdminUserResponse => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  plan: row.plan,
  currentPeriodEnd: row.plan === 'pro' ? row.current_period_end : null,
  cancelAtPeriodEnd: row.plan === 'pro' && row.cancel_at_period_end,
  applicationCount: row.application_count,
  lastActivityAt: row.last_activity_at,
  createdAt: row.created_at,
});

export async function listUsers(query: ListUsersQuery): Promise<PaginatedResponse<AdminUserResponse>> {
  const { page, pageSize } = query;
  let request = getAdminClient().from('admin_user_list').select(USER_COLUMNS, { count: 'exact' });

  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) request = request.or(`email.ilike.*${term}*,full_name.ilike.*${term}*`);
  }
  if (query.plan) request = request.eq('plan', query.plan);
  if (query.role) request = request.eq('role', query.role);

  const from = (page - 1) * pageSize;
  const { data, error, count: total } = await request
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
    .returns<AdminUserRow[]>();
  if (error) throw new Error(`Failed to list users: ${error.message}`);

  return { items: data.map(toUser), total: total ?? 0, page, pageSize };
}

async function getUser(id: string) {
  const { data, error } = await getAdminClient()
    .from('admin_user_list')
    .select(USER_COLUMNS)
    .eq('id', id)
    .maybeSingle<AdminUserRow>();
  if (error) throw new Error(`Failed to load user: ${error.message}`);
  if (!data) throw new HttpError(404, 'User not found');
  return data;
}

export async function updateUser(actingAdminId: string, id: string, input: UpdateUserInput): Promise<AdminUserResponse> {
  if (input.role && id === actingAdminId) {
    throw new HttpError(400, "You can't change your own role. Ask another admin.");
  }
  const user = await getUser(id);
  const db = getAdminClient();

  if (input.role && input.role !== user.role) {
    const { error } = await db.from('profiles').update({ role: input.role }).eq('id', id);
    if (error) throw new Error(`Failed to update role: ${error.message}`);
  }

  if (input.plan && input.plan !== user.plan) {
    const now = new Date();
    const changes =
      input.plan === 'pro'
        ? {
            plan: 'pro',
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: addDays(now, PLANS.pro.periodDays).toISOString(),
            cancel_at_period_end: false,
          }
        : { plan: 'free', status: 'active', current_period_end: null, cancel_at_period_end: false };
    const { error } = await db.from('subscriptions').update(changes).eq('user_id', id);
    if (error) throw new Error(`Failed to update plan: ${error.message}`);
  }

  return toUser(await getUser(id));
}

interface AdminPaymentRow {
  id: string;
  plan: 'free' | 'pro';
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
  profile: { email: string } | null;
}

export async function listAllPayments(query: ListAdminPaymentsQuery): Promise<PaginatedResponse<AdminPaymentResponse>> {
  const { page, pageSize } = query;
  let request = getAdminClient()
    .from('payments')
    .select(
      'id, plan, amount, currency, status, razorpay_order_id, razorpay_payment_id, created_at, profile:profiles(email)',
      { count: 'exact' },
    );
  if (query.status) request = request.eq('status', query.status);

  const from = (page - 1) * pageSize;
  const { data, error, count: total } = await request
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
    .returns<AdminPaymentRow[]>();
  if (error) throw new Error(`Failed to load payments: ${error.message}`);

  return {
    items: data.map((p) => ({
      id: p.id,
      plan: p.plan,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      orderId: p.razorpay_order_id,
      paymentId: p.razorpay_payment_id,
      createdAt: p.created_at,
      userEmail: p.profile?.email ?? 'Deleted user',
    })),
    total: total ?? 0,
    page,
    pageSize,
  };
}
