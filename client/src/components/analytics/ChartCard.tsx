import type { ReactNode } from 'react';
import { Card, CardHeader } from '../ui/Card.tsx';

interface ChartCardProps {
  title: string;
  description?: string;
  /** Shown instead of the chart when there is nothing to plot. */
  empty?: string | false;
  /** Accessible alternative: the same numbers as a table. */
  table: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, empty, table, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="px-3 pt-4 pb-2 sm:px-5">
        {empty ? (
          <p className="flex h-56 items-center justify-center rounded-lg bg-slate-50 px-4 text-center text-sm text-slate-500">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
      {!empty && (
        <details className="border-t border-slate-100 px-5 py-3 text-sm">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Show data as a table</summary>
          <div className="mt-3 overflow-x-auto">{table}</div>
        </details>
      )}
    </Card>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-slate-500">
        <tr>
          {columns.map((c, i) => (
            <th key={c} scope="col" className={i === 0 ? 'py-1 pr-4 font-medium' : 'py-1 pl-4 text-right font-medium'}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rows.map((row) => (
          <tr key={String(row[0])}>
            {row.map((cell, i) => (
              <td key={i} className={i === 0 ? 'py-1.5 pr-4' : 'py-1.5 pl-4 text-right tabular-nums'}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
