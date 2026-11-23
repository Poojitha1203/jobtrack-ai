import { apiRequest } from './api.ts';
import type { CompanySummary } from '../types/application.ts';

export const listCompanies = () =>
  apiRequest<{ items: CompanySummary[] }>('/companies').then((res) => res.items);
