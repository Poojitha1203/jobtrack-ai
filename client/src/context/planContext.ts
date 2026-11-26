import { createContext } from 'react';
import type { BillingOverview } from '../types/billing.ts';

export interface PlanContextValue {
  billing: BillingOverview | undefined;
  isPro: boolean;
  reload: () => void;
}

export const PlanContext = createContext<PlanContextValue | null>(null);
