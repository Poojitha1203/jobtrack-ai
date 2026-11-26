export type PlanId = 'free' | 'pro';

export interface PlanLimits {
  /** null = unlimited */
  applications: number | null;
  resumes: number | null;
  /** Longest analytics range in months (null = any, including all time). */
  analyticsMonths: number | null;
  /** How many skill-gap learning priorities are shown. */
  skillGapPriorities: number | null;
  /** Interview question difficulties available (null = all). */
  interviewDifficulties: ('easy' | 'medium' | 'hard')[] | null;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Price in paise (₹199 = 19900). */
  pricePaise: number;
  periodDays: number;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    pricePaise: 0,
    periodDays: 0,
    limits: { applications: 50, resumes: 1, analyticsMonths: 3, skillGapPriorities: 3, interviewDifficulties: ['easy'] },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    pricePaise: 19900,
    periodDays: 30,
    limits: { applications: null, resumes: null, analyticsMonths: null, skillGapPriorities: null, interviewDifficulties: null },
  },
};

export const PLAN_LIMIT = 'PLAN_LIMIT';
