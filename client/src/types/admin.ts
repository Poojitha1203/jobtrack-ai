import type { ApplicationStatus } from './application.ts';
import type { UserRole } from './api.ts';
import type { Payment, PlanId } from './billing.ts';

export interface AdminOverview {
  users: { total: number; newLast30Days: number; activeLast30Days: number; admins: number };
  applications: {
    total: number;
    newLast30Days: number;
    averagePerUser: number;
    byStatus: { status: ApplicationStatus; count: number }[];
  };
  activity: { interviews: number; resumes: number };
  subscriptions: { free: number; pro: number; cancelScheduled: number; conversionRate: number };
  payments: { paid: number; failed: number; pending: number; revenuePaise: number; currency: 'INR' };
  signupsByMonth: { month: string; label: string; count: number }[];
  system: {
    environment: string;
    nodeVersion: string;
    uptimeSeconds: number;
    databaseLatencyMs: number;
    paymentsConfigured: boolean;
    generatedAt: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  plan: PlanId;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  applicationCount: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface AdminPayment extends Payment {
  userEmail: string;
}

export interface AdminUserFilters {
  search: string;
  plan: '' | PlanId;
  role: '' | UserRole;
  page: number;
}

export type AdminUserUpdate = { role: UserRole } | { plan: PlanId };
