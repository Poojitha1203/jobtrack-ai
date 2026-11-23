import { useEffect, useState, type ReactNode } from 'react';
import { BriefcaseBusiness, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { getApiHealth } from './services/api.ts';

// Phase 1 "setup check" screen. It proves that React, TypeScript, Tailwind, Lucide icons,
// the Vite proxy, and the Express API are all wired together.
// Phase 2 replaces this with the real landing page and dashboard layout.

type CheckState = 'loading' | 'ok' | 'error';

interface StatusRowProps {
  label: string;
  state: CheckState;
  detail: string;
}

const STATUS_ICONS: Record<CheckState, ReactNode> = {
  loading: <Loader2 className="size-5 animate-spin text-slate-400" aria-hidden="true" />,
  ok: <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />,
  error: <XCircle className="size-5 text-rose-600" aria-hidden="true" />,
};

function StatusRow({ label, state, detail }: StatusRowProps) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="shrink-0">{STATUS_ICONS[state]}</span>
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm break-words text-slate-500">{detail}</p>
      </div>
    </li>
  );
}

interface ApiStatus {
  state: CheckState;
  detail: string;
}

const CHECKING: ApiStatus = { state: 'loading', detail: 'Checking /api/health…' };

// Calls the API and converts the result (or the error) into a status for the UI.
async function fetchApiStatus(): Promise<ApiStatus> {
  try {
    const health = await getApiHealth();
    return {
      state: 'ok',
      detail: `${health.service} is ${health.status} (${health.environment})`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { state: 'error', detail: `${message}. Is the server running on port 4000?` };
  }
}

export default function App() {
  const [api, setApi] = useState<ApiStatus>(CHECKING);
  // Incrementing this number re-runs the effect below (used by the "Re-check" button).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // If the component unmounts (or a new check starts) before the request finishes,
    // ignore the stale result instead of updating state.
    let cancelled = false;
    fetchApiStatus().then((status) => {
      if (!cancelled) setApi(status);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const handleRecheck = () => {
    setApi(CHECKING);
    setAttempt((n) => n + 1);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <BriefcaseBusiness className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">JobTrack AI</h1>
            <p className="text-sm text-slate-500">Phase 1 · Project setup check</p>
          </div>
        </div>

        <ul className="mt-6 divide-y divide-slate-100">
          <StatusRow label="React + Vite + TypeScript" state="ok" detail="Frontend is rendering." />
          <StatusRow
            label="Tailwind CSS & Lucide icons"
            state="ok"
            detail="If this card is styled and icons show, both are working."
          />
          <StatusRow label="Express API" state={api.state} detail={api.detail} />
        </ul>

        <button
          type="button"
          onClick={handleRecheck}
          disabled={api.state === 'loading'}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Re-check API
        </button>
      </div>
    </main>
  );
}
