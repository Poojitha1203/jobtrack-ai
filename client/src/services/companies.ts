import { apiRequest } from './api.ts';
import type { Company, CompanyInput } from '../types/company.ts';

export const listCompanies = (search?: string) => {
  const query = search ? `?${new URLSearchParams({ search })}` : '';
  return apiRequest<{ items: Company[] }>(`/companies${query}`).then((res) => res.items);
};

export const getCompany = (id: string) => apiRequest<Company>(`/companies/${encodeURIComponent(id)}`);

export const createCompany = (input: CompanyInput) =>
  apiRequest<Company>('/companies', { method: 'POST', body: JSON.stringify(input) });

export const updateCompany = (id: string, changes: Partial<CompanyInput>) =>
  apiRequest<Company>(`/companies/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });

export const deleteCompany = (id: string) =>
  apiRequest<void>(`/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
