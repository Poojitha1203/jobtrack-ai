import { apiRequest } from './api.ts';
import type { AnalyticsRange, AnalyticsReport } from '../types/analytics.ts';

export const getAnalytics = (months: AnalyticsRange) => apiRequest<AnalyticsReport>(`/analytics?months=${months}`);
