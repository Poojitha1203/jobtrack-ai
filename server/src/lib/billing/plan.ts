import type { PlanId } from '../../constants/plans.js';

export interface SubscriptionRow {
  id: string;
  plan: PlanId;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/**
 * The plan a user actually gets right now. A Pro subscription whose paid period has ended
 * falls back to Free automatically — no background job needed.
 */
export function effectivePlan(row: SubscriptionRow | null, now: Date = new Date()): PlanId {
  if (!row || row.plan !== 'pro' || row.status !== 'active') return 'free';
  if (row.current_period_end && new Date(row.current_period_end).getTime() <= now.getTime()) return 'free';
  return 'pro';
}

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
