interface TooltipEntry {
  dataKey?: unknown;
  name?: unknown;
  value?: unknown;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: unknown;
  formatValue?: (value: number, name: string) => string;
}

/** Tooltip card in the app's style: title + one row per series, values in text colours (not series colours). */
export function ChartTooltip({ active, payload, label, formatValue = (value) => value.toLocaleString() }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label !== undefined && label !== '' && <p className="mb-1 font-medium text-slate-900">{String(label)}</p>}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2 text-slate-600">
            <span className="size-2 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
            <span>{String(entry.name)}</span>
            <span className="ml-auto pl-3 font-medium text-slate-900 tabular-nums">
              {typeof entry.value === 'number' ? formatValue(entry.value, String(entry.name)) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
