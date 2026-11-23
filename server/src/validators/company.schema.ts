import { z } from 'zod';
import { nonEmpty, optionalEmail, optionalHttpUrl, optionalQuery, optionalText } from './common.js';

const companyFields = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(150, 'Must be 150 characters or fewer'),
  website: optionalHttpUrl,
  location: optionalText(150),
  industry: optionalText(100),
  contactName: optionalText(100),
  contactEmail: optionalEmail,
  notes: optionalText(5000),
});

export const createCompanySchema = companyFields.partial().required({ name: true }).strict();

export const updateCompanySchema = companyFields.partial().strict().refine(nonEmpty, 'Send at least one field to update');

export const listCompaniesQuerySchema = z.object({
  search: optionalQuery(z.string().trim().max(100)),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
