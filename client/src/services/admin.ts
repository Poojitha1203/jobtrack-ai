import { apiRequest } from './api.ts';
import type { PaginatedResponse } from '../types/api.ts';
import type { AdminOverview, AdminPayment, AdminUser, AdminUserFilters, AdminUserUpdate } from '../types/admin.ts';

export const USERS_PAGE_SIZE = 20;

const query = (params: Record<string, string | number>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== '') search.set(key, String(value));
  return search.toString();
};

export const getAdminOverview = () => apiRequest<AdminOverview>('/admin/overview');

export const listAdminUsers = (filters: AdminUserFilters) =>
  apiRequest<PaginatedResponse<AdminUser>>(`/admin/users?${query({ ...filters, pageSize: USERS_PAGE_SIZE })}`);

export const updateAdminUser = (id: string, changes: AdminUserUpdate) =>
  apiRequest<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });

export const listAdminPayments = (pageSize = 8) =>
  apiRequest<PaginatedResponse<AdminPayment>>(`/admin/payments?${query({ pageSize })}`);
