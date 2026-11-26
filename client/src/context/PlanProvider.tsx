import { useEffect, useMemo, type ReactNode } from 'react';
import { PlanContext } from './planContext.ts';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { getBillingOverview, onPlanChanged } from '../services/billing.ts';

export function PlanProvider({ children }: { children: ReactNode }) {
  const { data, reload } = useAsyncData(getBillingOverview, 'billing-overview');

  useEffect(() => onPlanChanged(reload), [reload]);

  const value = useMemo(() => ({ billing: data, isPro: data?.plan === 'pro', reload }), [data, reload]);
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
