import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getAuth } from '../middleware/requireAuth.js';
import { getAnalytics } from '../services/analytics.service.js';
import { parseQuery } from '../utils/parse.js';
import { withDefault } from '../validators/common.js';
import type { AnalyticsResult } from '../lib/analytics/compute.js';

const querySchema = z.object({

  months: withDefault(z.coerce.number().pipe(z.union([z.literal(0), z.literal(3), z.literal(6), z.literal(12)])).default(6)),
});

const router = Router();

router.get('/', async (req: Request, res: Response<AnalyticsResult>) => {
  const { supabase } = getAuth(req);
  const { months } = parseQuery(querySchema, req.query);
  res.json(await getAnalytics(supabase, months));
});

export default router;
