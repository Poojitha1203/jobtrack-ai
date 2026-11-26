import type { BadgeTone } from '../components/ui/Badge.tsx';
import type { Payment } from '../types/billing.ts';

export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export const PAYMENT_STATUS: Record<Payment['status'], { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  created: { label: 'Not completed', tone: 'neutral' },
};
