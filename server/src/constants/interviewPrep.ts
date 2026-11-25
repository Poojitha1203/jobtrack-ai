export const QUESTION_CATEGORIES = [
  'javascript',
  'react',
  'html',
  'css',
  'nodejs',
  'sql',
  'rest_api',
  'git',
  'hr',
  'behavioral',
] as const;
export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const PRACTICE_STATUSES = ['not_started', 'practicing', 'confident'] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];
