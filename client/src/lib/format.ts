// Date-only strings (YYYY-MM-DD) are parsed as LOCAL dates.
// `new Date('2026-11-23')` would be UTC midnight and can show the previous day in some time zones.
export function parseDateOnly(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayDateOnly = () => toDateOnly(new Date());

const mediumDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export const formatDateOnly = (value: string | null, fallback = '—') =>
  value ? mediumDate.format(parseDateOnly(value)) : fallback;

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

const currencyFormatters = new Map<string, Intl.NumberFormat | null>();

function formatMoney(amount: number, currency: string): string {
  if (!currencyFormatters.has(currency)) {
    try {
      currencyFormatters.set(
        currency,
        new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
          style: 'currency',
          currency,
          notation: 'compact',
          maximumFractionDigits: 1,
        }),
      );
    } catch {
      currencyFormatters.set(currency, null);
    }
  }
  const formatter = currencyFormatters.get(currency);
  return formatter ? formatter.format(amount) : `${currency} ${amount.toLocaleString()}`;
}

/** "₹6L – ₹9L", "$90K+", "Up to €50K", or null when no salary is recorded. */
export function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return min === max ? formatMoney(min, currency) : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  }
  return min != null ? `${formatMoney(min, currency)}+` : `Up to ${formatMoney(max!, currency)}`;
}
