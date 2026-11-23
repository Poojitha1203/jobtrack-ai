import { DEFAULT_SORT, SORT_OPTIONS } from './applicationOptions.ts';
import {
  APPLICATION_STATUSES,
  JOB_TYPES,
  WORK_MODES,
  type ApplicationQuery,
} from '../types/application.ts';

// Filters live in the URL (?q=react&status=applied&page=2), so they survive a reload,
// work with the browser's back button, and can be bookmarked or shared.

export interface ApplicationUrlFilters {
  q: string;
  status: string;
  company: string;
  location: string;
  type: string;
  mode: string;
  from: string;
  to: string;
  sort: string;
}

export const FILTER_KEYS = ['q', 'status', 'company', 'location', 'type', 'mode', 'from', 'to', 'sort'] as const;
export const ADVANCED_FILTER_KEYS = ['company', 'location', 'type', 'mode', 'from', 'to'] as const;

export const PAGE_SIZE = 20;

export function readFilters(params: URLSearchParams): ApplicationUrlFilters {
  const get = (key: string) => params.get(key) ?? '';
  return {
    q: get('q'),
    status: get('status'),
    company: get('company'),
    location: get('location'),
    type: get('type'),
    mode: get('mode'),
    from: get('from'),
    to: get('to'),
    sort: SORT_OPTIONS.some((o) => o.value === get('sort')) ? get('sort') : DEFAULT_SORT.value,
  };
}

export function readPage(params: URLSearchParams): number {
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Ignores values that were hand-edited into the URL and aren't valid. */
const oneOf = <T extends string>(value: string, allowed: readonly T[]): T | undefined =>
  (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toApplicationQuery(filters: ApplicationUrlFilters, page: number): ApplicationQuery {
  const sort = SORT_OPTIONS.find((o) => o.value === filters.sort) ?? DEFAULT_SORT;
  return {
    search: filters.q || undefined,
    status: oneOf(filters.status, APPLICATION_STATUSES),
    companyId: filters.company || undefined,
    location: filters.location || undefined,
    jobType: oneOf(filters.type, JOB_TYPES),
    workMode: oneOf(filters.mode, WORK_MODES),
    appliedFrom: DATE_ONLY.test(filters.from) ? filters.from : undefined,
    appliedTo: DATE_ONLY.test(filters.to) ? filters.to : undefined,
    sort: sort.sort,
    order: sort.order,
    page,
    pageSize: PAGE_SIZE,
  };
}

export const hasActiveFilters = (filters: ApplicationUrlFilters) =>
  Boolean(filters.q || filters.status || ADVANCED_FILTER_KEYS.some((key) => filters[key]));
