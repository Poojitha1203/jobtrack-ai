import { Building2, Phone, Video, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '../components/ui/Badge.tsx';
import type { InterviewResult, InterviewType } from '../types/interview.ts';

export const INTERVIEW_TYPE_META: Record<InterviewType, { label: string; icon: LucideIcon }> = {
  phone: { label: 'Phone', icon: Phone },
  video: { label: 'Video call', icon: Video },
  onsite: { label: 'On-site', icon: Building2 },
};

export const INTERVIEW_RESULT_META: Record<InterviewResult, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'info' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Not selected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const ROUND_SUGGESTIONS = [
  'Recruiter screening',
  'HR round',
  'Online assessment',
  'Technical round 1',
  'Technical round 2',
  'System design',
  'Managerial round',
  'Final round',
];

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
