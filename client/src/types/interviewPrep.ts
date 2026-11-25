export const QUESTION_CATEGORIES = ['javascript', 'react', 'html', 'css', 'nodejs', 'sql', 'rest_api', 'git', 'hr', 'behavioral'] as const;
export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const PRACTICE_STATUSES = ['not_started', 'practicing', 'confident'] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  question: string;
  suggestedAnswer: string;
  tags: string[];
  status: PracticeStatus;
  notes: string | null;
  lastPracticedAt: string | null;
}

export interface QuestionStats {
  total: number;
  confident: number;
  practicing: number;
  notStarted: number;
  byCategory: { category: QuestionCategory; total: number; confident: number; practicing: number }[];
}

export interface QuestionQuery {
  categories?: QuestionCategory[];
  difficulty?: QuestionDifficulty;
  status?: PracticeStatus;
  search?: string;
}

export interface PrepRecommendations {
  context: { jobTitle: string; company: string | null } | null;
  recommendations: { category: QuestionCategory; reasons: string[] }[];
}
