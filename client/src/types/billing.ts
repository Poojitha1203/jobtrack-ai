export type PlanId = 'free' | 'pro';

export interface PlanLimits {
  applications: number | null;
  resumes: number | null;
  analyticsMonths: number | null;
  skillGapPriorities: number | null;
  interviewDifficulties: ('easy' | 'medium' | 'hard')[] | null;
}

export interface BillingOverview {
  plan: PlanId;
  subscription: {
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  limits: PlanLimits;
  usage: { applications: number; resumes: number };
  plans: { id: PlanId; name: string; pricePaise: number; periodDays: number; limits: PlanLimits }[];
  payments: { enabled: boolean; testMode: true; keyId: string | null };
}

export interface CheckoutOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planName: string;
}

export interface Payment {
  id: string;
  plan: PlanId;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  orderId: string;
  paymentId: string | null;
  createdAt: string;
}
