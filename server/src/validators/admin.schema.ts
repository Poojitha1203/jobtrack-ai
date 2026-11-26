import { z } from 'zod';
import { nonEmpty, optionalQuery, withDefault } from './common.js';

const page = withDefault(z.coerce.number().int().min(1).max(10_000).default(1));
const pageSize = withDefault(z.coerce.number().int().min(1).max(50).default(20));

export const listUsersQuerySchema = z.object({
  search: optionalQuery(z.string().trim().max(100)),
  plan: optionalQuery(z.enum(['free', 'pro'])),
  role: optionalQuery(z.enum(['user', 'admin'])),
  page,
  pageSize,
});

export const listAdminPaymentsQuerySchema = z.object({
  status: optionalQuery(z.enum(['created', 'paid', 'failed'])),
  page,
  pageSize,
});

export const updateUserSchema = z
  .object({
    role: z.enum(['user', 'admin']).optional(),
    plan: z.enum(['free', 'pro']).optional(),
  })
  .strict()
  .refine(nonEmpty, 'Nothing to update');

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListAdminPaymentsQuery = z.infer<typeof listAdminPaymentsQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
