import type { BadgeTone } from '../components/ui/Badge.tsx';
import type { ApplicationStatus } from '../types/application.ts';

// One place that decides how each status looks everywhere in the app
// (badges, chart bars, Kanban column headers later).
// Full class names are written out so Tailwind can find them when it scans the code.
export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: BadgeTone; barClass: string }
> = {
  wishlist: { label: 'Wishlist', tone: 'neutral', barClass: 'bg-slate-400' },
  applied: { label: 'Applied', tone: 'info', barClass: 'bg-sky-500' },
  assessment: { label: 'Assessment', tone: 'warning', barClass: 'bg-amber-500' },
  interview: { label: 'Interview', tone: 'violet', barClass: 'bg-violet-500' },
  offer: { label: 'Offer', tone: 'success', barClass: 'bg-emerald-500' },
  rejected: { label: 'Rejected', tone: 'danger', barClass: 'bg-rose-500' },
};
