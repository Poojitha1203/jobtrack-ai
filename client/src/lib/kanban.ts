import type { UniqueIdentifier } from '@dnd-kit/core';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../types/application.ts';

export type Columns = Record<ApplicationStatus, Application[]>;

const COLUMN_PREFIX = 'column:';

export const columnDropId = (status: ApplicationStatus) => `${COLUMN_PREFIX}${status}`;

export function groupByStatus(applications: Application[]): Columns {
  const columns = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, [] as Application[]])) as Columns;
  for (const app of applications) columns[app.status].push(app);
  for (const status of APPLICATION_STATUSES) {
    columns[status].sort((a, b) => a.position - b.position || b.createdAt.localeCompare(a.createdAt));
  }
  return columns;
}

/** The column a card id (or a column's own drop-zone id) belongs to. */
export function findColumn(columns: Columns, id: UniqueIdentifier): ApplicationStatus | undefined {
  const value = String(id);
  if (value.startsWith(COLUMN_PREFIX)) return value.slice(COLUMN_PREFIX.length) as ApplicationStatus;
  return APPLICATION_STATUSES.find((status) => columns[status].some((app) => app.id === value));
}

export function findApplication(columns: Columns, id: UniqueIdentifier): Application | undefined {
  for (const status of APPLICATION_STATUSES) {
    const app = columns[status].find((a) => a.id === String(id));
    if (app) return app;
  }
  return undefined;
}

export const sameOrder = (a: Application[], b: Application[]) =>
  a.length === b.length && a.every((app, i) => app.id === b[i]?.id);
