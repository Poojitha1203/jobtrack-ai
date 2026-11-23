import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { NavItem } from '../config/navigation.ts';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';

// Placeholder for pages that aren't built yet, so every sidebar link works.
// Each real page replaces its placeholder in the phase shown.
export function ComingSoonPage({ item }: { item: NavItem }) {
  useDocumentTitle(item.label);

  return (
    <div className="space-y-6">
      <PageHeader title={item.label} description={item.description} />
      <Card>
        <EmptyState
          icon={item.icon}
          title={`${item.label} is on its way`}
          description={
            <>
              This page is built in <Badge tone="brand">Phase {item.phase}</Badge> of the project roadmap.
            </>
          }
          action={
            <Link to="/dashboard" className={buttonClasses({ variant: 'secondary' })}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to dashboard
            </Link>
          }
          className="py-16"
        />
      </Card>
    </div>
  );
}
