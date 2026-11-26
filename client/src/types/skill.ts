export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];
export type GapPriority = 'high' | 'medium' | 'low';

export interface CatalogSkill {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  skillId: string;
  name: string;
  category: string;
  level: SkillLevel;
  progress: number;
  isLearningGoal: boolean;
  updatedAt: string;
}

export interface DemandedSkill {
  skillId: string;
  name: string;
  category: string;
  jobCount: number;
  requiredIn: number;
  percentOfJobs: number;
  status: 'have' | 'learning' | 'missing';
  inResume: boolean;
  priority: GapPriority | null;
  level: SkillLevel | null;
  progress: number | null;
}

export interface SkillGapReport {
  jobsAnalyzed: number;
  demanded: DemandedSkill[];
  gaps: DemandedSkill[];
  categories: { category: string; demanded: number; have: number }[];
  resumeTitle: string | null;
  planLimited: { hiddenGaps: number } | null;
}

export type UserSkillChanges = Partial<Pick<UserSkill, 'level' | 'progress' | 'isLearningGoal'>>;
