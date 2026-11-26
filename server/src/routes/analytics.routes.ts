import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getAuth } from '../middleware/requireAuth.js';
import { getAnalytics } from '../services/analytics.service.js';
import { getPlan } from '../services/plan.service.js';
import { parseQuery } from '../utils/parse.js';
import { withDefault } from '../validators/common.js';
import type { AnalyticsResult } from '../lib/analytics/compute.js';

const querySchema = z.object({

  months: withDefault(z.coerce.number().pipe(z.union([z.literal(0), z.literal(3), z.literal(6), z.literal(12)])).default(6)),
});

const router = Router();

router.get('/', async (req: Request, res: Response<AnalyticsResult & { planLimited: { maxMonths: number } | null }>) => {
  const { supabase } = getAuth(req);
  const { months } = parseQuery(querySchema, req.query);
  const { limits } = await getPlan(supabase);
  const max = limits.analyticsMonths;
  // Free plan: longer ranges (and "all time") are clamped to the allowed window.
  const clamped = max !== null && (months === 0 || months > max) ? max : months;
  res.json({ ...(await getAnalytics(supabase, clamped)), planLimited: clamped !== months ? { maxMonths: clamped } : null });
});

export default router;
