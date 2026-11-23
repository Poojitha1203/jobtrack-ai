import { Link } from 'react-router';
import { SearchX } from 'lucide-react';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <SearchX className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-slate-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/dashboard" className={buttonClasses()}>
          Go to dashboard
        </Link>
        <Link to="/" className={buttonClasses({ variant: 'secondary' })}>
          Home page
        </Link>
      </div>
    </main>
  );
}
