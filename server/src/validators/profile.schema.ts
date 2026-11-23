import { z } from 'zod';

// Optional text field: trims spaces and turns "" into null (= clear the value).
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .nullable()
    .transform((value) => (value === '' ? null : value));

// PATCH /api/profile — every field is optional, but at least one must be sent.
// `.strict()` rejects unknown fields, so a client can't sneak in `role: 'admin'`.
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Name is required').max(100, 'Must be 100 characters or fewer'),
    headline: optionalText(150),
    location: optionalText(100),
    weeklyGoal: z.number().int('Must be a whole number').min(1, 'Minimum is 1').max(100, 'Maximum is 100'),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Send at least one field to update');

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
