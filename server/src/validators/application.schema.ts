import { z } from 'zod';
import { APPLICATION_STATUSES, JOB_TYPES, SORT_COLUMNS, WORK_MODES } from '../constants/application.js';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .nullable()
    .transform((value) => (value === '' ? null : value));

const salary = z
  .number('Must be a number')
  .int('Must be a whole number')
  .min(0, 'Cannot be negative')
  .max(1_000_000_000, 'That number is too large')
  .nullable();

// Only http(s) links — blocks "javascript:" and other dangerous URL schemes.
const jobUrl = z
  .union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Enter a full link starting with http:// or https://' })])
  .nullable()
  .transform((value) => (value === '' ? null : value));

const applicationFields = z.object({
  jobTitle: z.string().trim().min(1, 'Job title is required').max(150, 'Must be 150 characters or fewer'),
  companyName: z.string().trim().min(1, 'Company is required').max(150, 'Must be 150 characters or fewer'),
  location: optionalText(150),
  jobType: z.enum(JOB_TYPES).nullable(),
  workMode: z.enum(WORK_MODES).nullable(),
  salaryMin: salary,
  salaryMax: salary,
  salaryCurrency: z.string().regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code like INR'),
  jobDescription: optionalText(20000),
  jobUrl,
  source: optionalText(100),
  status: z.enum(APPLICATION_STATUSES),
  appliedAt: z.iso.date('Use the format YYYY-MM-DD').nullable(),
  notes: optionalText(5000),
});

type SalaryRange = { salaryMin?: number | null; salaryMax?: number | null };

const salaryRangeIsValid = (data: SalaryRange) =>
  data.salaryMin == null || data.salaryMax == null || data.salaryMax >= data.salaryMin;

const salaryRangeIssue = { message: 'Maximum must be greater than or equal to minimum', path: ['salaryMax'] };

export const createApplicationSchema = applicationFields
  .partial()
  .required({ jobTitle: true, companyName: true })
  .strict()
  .refine(salaryRangeIsValid, salaryRangeIssue);

export const updateApplicationSchema = applicationFields
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Send at least one field to update')
  .refine(salaryRangeIsValid, salaryRangeIssue);

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalQuery = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());

export const listApplicationsQuerySchema = z.object({
  search: optionalQuery(z.string().trim().max(100)),
  status: optionalQuery(z.enum(APPLICATION_STATUSES)),
  companyId: optionalQuery(z.uuid()),
  location: optionalQuery(z.string().trim().max(150)),
  jobType: optionalQuery(z.enum(JOB_TYPES)),
  workMode: optionalQuery(z.enum(WORK_MODES)),
  appliedFrom: optionalQuery(z.iso.date()),
  appliedTo: optionalQuery(z.iso.date()),
  sort: z.preprocess(emptyToUndefined, z.enum(Object.keys(SORT_COLUMNS) as [keyof typeof SORT_COLUMNS]).default('appliedAt')),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export const idParamSchema = z.uuid();
