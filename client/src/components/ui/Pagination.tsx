import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.tsx';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Pagination">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{first}</span>–
        <span className="font-medium text-slate-700">{last}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </Button>
          <span className="text-sm text-slate-500 tabular-nums">
            {page} / {pageCount}
          </span>
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </nav>
  );
}
