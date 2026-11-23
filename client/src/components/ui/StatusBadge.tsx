import { STATUS_META } from '../../lib/status.ts';
import type { ApplicationStatus } from '../../types/application.ts';
import { Badge } from './Badge.tsx';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
