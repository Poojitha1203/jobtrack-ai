export type Importance = 'required' | 'preferred';
export type MatchLevel = 'strong' | 'moderate' | 'low';

export interface SkillHit {
  name: string;
  category: string;
  importance: Importance;
  mentions: number;
  sources: ('resume' | 'profile')[];
}

export interface JobMatchResult {
  score: number | null;
  level: MatchLevel | null;
  matched: SkillHit[];
  missing: SkillHit[];
  recommended: SkillHit[];
  extraSkills: { name: string; category: string }[];
  keywords: { term: string; count: number; inResume: boolean }[];
  experience: string | null;
  resume: { id: string; title: string; hasText: boolean } | null;
  catalogSize: number;
}

export interface JobMatchInput {
  jobDescription: string;
  resumeId?: string;
  resumeText?: string;
}
