import { CalendarClock, Hourglass, Reply, StickyNote, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '../components/ui/Badge.tsx';
import type { ReminderType } from '../types/reminder.ts';

export const REMINDER_TYPE_META: Record<ReminderType, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  follow_up: { label: 'Follow-up', icon: Reply, tone: 'brand' },
  interview: { label: 'Interview', icon: CalendarClock, tone: 'violet' },
  deadline: { label: 'Deadline', icon: Hourglass, tone: 'warning' },
  custom: { label: 'Custom', icon: StickyNote, tone: 'neutral' },
};
