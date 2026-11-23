import { useEffect, useState } from 'react';
import { getApiHealth } from '../../services/api.ts';
import { cn } from '../../lib/cn.ts';

type ApiState = 'checking' | 'online' | 'offline';

const LABELS: Record<ApiState, string> = {
  checking: 'Checking API…',
  online: 'API online',
  offline: 'API offline',
};

const DOTS: Record<ApiState, string> = {
  checking: 'bg-slate-300',
  online: 'bg-emerald-500',
  offline: 'bg-rose-500',
};

// Small developer-friendly indicator in the sidebar footer.
// It keeps the Phase 1 health check visible while we build the rest of the app.
export function ApiStatusIndicator() {
  const [state, setState] = useState<ApiState>('checking');

  useEffect(() => {
    let cancelled = false;
    getApiHealth()
      .then(() => !cancelled && setState('online'))
      .catch(() => !cancelled && setState('offline'));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p className="flex items-center gap-2 text-xs text-slate-500" role="status">
      <span className={cn('size-2 rounded-full', DOTS[state])} aria-hidden="true" />
      {LABELS[state]}
    </p>
  );
}
