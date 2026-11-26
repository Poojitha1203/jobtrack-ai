import { Router, type Request, type Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';
import { byUser, rateLimit } from '../middleware/rateLimit.js';
import * as billing from '../services/billing.service.js';
import { cancelSchema, paymentFailedSchema, verifyPaymentSchema, type VerifyPaymentInput } from '../validators/billing.schema.js';

const router = Router();

// Each checkout call reaches Razorpay, so keep retries and scripted abuse in check.
const paymentLimit = rateLimit({ windowMs: 60_000, max: 10, keyBy: byUser, message: 'Too many payment attempts. Please wait a minute.' });

router.get('/overview', async (req: Request, res: Response) => {
  res.json(await billing.getBillingOverview(getAuth(req).supabase));
});

router.get('/payments', async (req: Request, res: Response) => {
  res.json({ items: await billing.listPayments(getAuth(req).supabase) });
});

router.post('/orders', paymentLimit, async (req: Request, res: Response) => {
  const { supabase, userId } = getAuth(req);
  res.status(201).json(await billing.createCheckoutOrder(supabase, userId));
});

router.post('/verify', paymentLimit, validateBody(verifyPaymentSchema), async (req: Request, res: Response) => {
  const { supabase, userId } = getAuth(req);
  res.json(await billing.verifyCheckoutPayment(supabase, userId, req.body as VerifyPaymentInput));
});

router.post('/failed', paymentLimit, validateBody(paymentFailedSchema), async (req: Request, res: Response) => {
  await billing.markPaymentFailed(getAuth(req).userId, (req.body as { razorpayOrderId: string }).razorpayOrderId);
  res.status(204).end();
});

router.post('/cancel', validateBody(cancelSchema), async (req: Request, res: Response) => {
  const { supabase, userId } = getAuth(req);
  res.json(await billing.setCancelAtPeriodEnd(supabase, userId, (req.body as { cancel: boolean }).cancel));
});

router.post('/downgrade', async (req: Request, res: Response) => {
  const { supabase, userId } = getAuth(req);
  res.json(await billing.downgradeNow(supabase, userId));
});

export default router;
