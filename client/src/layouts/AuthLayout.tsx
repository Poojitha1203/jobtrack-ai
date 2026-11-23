import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { Logo } from '../components/layout/Logo.tsx';

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Text under the form, e.g. "Don't have an account? Sign up" */
  footer?: ReactNode;
}

const HIGHLIGHTS = [
  'Track every application from wishlist to offer',
  'Never miss an interview or follow-up',
  'See which skills employers keep asking for',
];

// Split-screen layout for login, register and password pages:
// form on the left, brand panel on the right (hidden on small screens).
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Link to="/" className="self-start" aria-label="JobTrack AI home">
          <Logo />
        </Link>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>}
          </div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-600 via-brand-700 to-brand-950 lg:flex lg:flex-col lg:justify-center lg:px-16">
        {/* Soft decorative circles */}
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-violet-400/20 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-md">
          <p className="text-3xl leading-tight font-semibold text-white">
            Every application. Every interview. One calm place.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-start gap-3 text-brand-100">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-white" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-12 grid grid-cols-3 gap-3" aria-hidden="true">
            {[
              ['Applied', '24'],
              ['Interviews', '6'],
              ['Offers', '2'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                <p className="text-xs text-brand-100">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
