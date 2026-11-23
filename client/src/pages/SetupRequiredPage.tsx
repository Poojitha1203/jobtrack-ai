import { Settings2 } from 'lucide-react';
import { Logo } from '../components/layout/Logo.tsx';
import { Card } from '../components/ui/Card.tsx';

// Shown instead of the app when client/.env is missing the Supabase settings,
// so a fresh clone explains what to do instead of showing a blank screen.
export function SetupRequiredPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo />
      <Card className="mt-8 w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Settings2 className="size-5" aria-hidden="true" />
          </span>
          <h1 className="text-lg font-semibold text-slate-900">Supabase isn&apos;t configured yet</h1>
        </div>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Copy <code className="rounded bg-slate-100 px-1 py-0.5">client/.env.example</code> to{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">client/.env</code>.
          </li>
          <li>
            Fill in <code className="rounded bg-slate-100 px-1 py-0.5">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">VITE_SUPABASE_PUBLISHABLE_KEY</code> from Supabase →
            Project Settings → API Keys.
          </li>
          <li>Stop the dev server (Ctrl + C) and run <code className="rounded bg-slate-100 px-1 py-0.5">npm run dev</code> again.</li>
        </ol>
      </Card>
    </main>
  );
}
