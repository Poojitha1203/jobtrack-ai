import { apiRequest } from './api.ts';
import type {
  InterviewQuestion,
  PracticeStatus,
  PrepRecommendations,
  QuestionQuery,
  QuestionStats,
} from '../types/interviewPrep.ts';

export function listQuestions(query: QuestionQuery = {}) {
  const params = new URLSearchParams();
  if (query.categories?.length) params.set('categories', query.categories.join(','));
  if (query.difficulty) params.set('difficulty', query.difficulty);
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  return apiRequest<{ items: InterviewQuestion[]; stats: QuestionStats }>(`/interview-prep/questions?${params}`);
}

export function getPrepRecommendations(target: { applicationId?: string; jobTitle?: string } = {}) {
  const params = new URLSearchParams();
  if (target.applicationId) params.set('applicationId', target.applicationId);
  else if (target.jobTitle) params.set('jobTitle', target.jobTitle);
  return apiRequest<PrepRecommendations>(`/interview-prep/recommendations?${params}`);
}

export const saveQuestionProgress = (questionId: string, changes: { status?: PracticeStatus; notes?: string | null }) =>
  apiRequest<Pick<InterviewQuestion, 'status' | 'notes' | 'lastPracticedAt'>>(
    `/interview-prep/progress/${encodeURIComponent(questionId)}`,
    { method: 'PUT', body: JSON.stringify(changes) },
  );
