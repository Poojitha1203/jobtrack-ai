import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANS, type PlanId, type PlanLimits } from '../constants/plans.js';
import { effectivePlan, type SubscriptionRow } from '../lib/billing/plan.js';

export async function getSubscriptionRow(supabase: SupabaseClient): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan, status, current_period_start, current_period_end, cancel_at_period_end')
    .maybeSingle<SubscriptionRow>();
  if (error) throw new Error(`Failed to load subscription: ${error.message}`);
  return data;
}

/** The caller's current plan and its limits (read with the user's own client, so RLS applies). */
export async function getPlan(supabase: SupabaseClient): Promise<{ id: PlanId; limits: PlanLimits; row: SubscriptionRow | null }> {
  const row = await getSubscriptionRow(supabase);
  const id = effectivePlan(row);
  return { id, limits: PLANS[id].limits, row };
}

export async function countRows(supabase: SupabaseClient, table: 'applications' | 'resumes'): Promise<number> {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw new Error(`Failed to count ${table}: ${error.message}`);
  return count ?? 0;
}
