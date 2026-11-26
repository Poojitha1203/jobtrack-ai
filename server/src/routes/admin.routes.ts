import { Router, type Request, type Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';
import { byUser, rateLimit } from '../middleware/rateLimit.js';
import * as admin from '../services/admin.service.js';
import { parseId, parseQuery } from '../utils/parse.js';
import {
  listAdminPaymentsQuerySchema,
  listUsersQuerySchema,
  updateUserSchema,
  type UpdateUserInput,
} from '../validators/admin.schema.js';

const router = Router();

router.get('/overview', async (_req: Request, res: Response) => {
  res.json(await admin.getAdminOverview());
});

router.get('/users', async (req: Request, res: Response) => {
  res.json(await admin.listUsers(parseQuery(listUsersQuerySchema, req.query)));
});

router.patch(
  '/users/:id',
  rateLimit({ windowMs: 60_000, max: 30, keyBy: byUser }),
  validateBody(updateUserSchema),
  async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    res.json(await admin.updateUser(userId, parseId(req.params.id, 'User'), req.body as UpdateUserInput));
  },
);

router.get('/payments', async (req: Request, res: Response) => {
  res.json(await admin.listAllPayments(parseQuery(listAdminPaymentsQuerySchema, req.query)));
});

export default router;
