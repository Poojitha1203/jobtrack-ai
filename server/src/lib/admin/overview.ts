const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

/** The last `count` months (oldest first) with zero-filled totals, so the chart has no gaps. */
export function fillMonths(rows: { month: string; count: number }[], count: number, today = new Date()) {
  const totals = new Map(rows.map((row) => [row.month, row.count]));
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (count - 1 - i), 1));
    const month = date.toISOString().slice(0, 7);
    return { month, label: MONTH_LABEL.format(date), count: totals.get(month) ?? 0 };
  });
}

/** Whole-number percentage; 0 when there is nothing to divide by. */
export const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
