import { Link } from 'react-router';
import { LogIn } from 'lucide-react';
import { Logo } from '../components/layout/Logo.tsx';
import { Card } from '../components/ui/Card.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';

// Temporary stand-in for /login and /register. Replaced by real forms in Phase 3.
export function AuthPlaceholderPage({ mode }: { mode: 'login' | 'register' }) {
  const title = mode === 'login' ? 'Log in' : 'Create your account';
  useDocumentTitle(title);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link to="/" aria-label="JobTrack AI home">
        <Logo />
      </Link>
      <Card className="mt-8 w-full max-w-md">
        <EmptyState
          icon={LogIn}
          title={title}
          description="Sign-up and login arrive in Phase 3 with Supabase Auth. Until then, explore the demo dashboard."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/dashboard" className={buttonClasses()}>
                Open demo dashboard
              </Link>
              <Link to="/" className={buttonClasses({ variant: 'secondary' })}>
                Back home
              </Link>
            </div>
          }
        />
      </Card>
    </div>
  );
}
