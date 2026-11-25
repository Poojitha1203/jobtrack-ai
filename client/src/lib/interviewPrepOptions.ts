import type { BadgeTone } from '../components/ui/Badge.tsx';
import type { PracticeStatus, QuestionCategory, QuestionDifficulty } from '../types/interviewPrep.ts';

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  javascript: 'JavaScript',
  react: 'React',
  html: 'HTML',
  css: 'CSS',
  nodejs: 'Node.js',
  sql: 'SQL',
  rest_api: 'REST APIs',
  git: 'Git',
  hr: 'HR',
  behavioral: 'Behavioral',
};

export const DIFFICULTY_META: Record<QuestionDifficulty, { label: string; tone: BadgeTone }> = {
  easy: { label: 'Easy', tone: 'success' },
  medium: { label: 'Medium', tone: 'warning' },
  hard: { label: 'Hard', tone: 'danger' },
};

export const PRACTICE_STATUS_META: Record<PracticeStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: 'Not started', tone: 'neutral' },
  practicing: { label: 'Practicing', tone: 'info' },
  confident: { label: 'Confident', tone: 'success' },
};
