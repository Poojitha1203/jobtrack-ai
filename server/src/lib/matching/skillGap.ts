import { detectJobSkills } from './analyzer.js';
import { countMatches, normalize, type CompiledSkill } from './text.js';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type GapPriority = 'high' | 'medium' | 'low';

export interface UserSkillState {
  level: SkillLevel;
  progress: number;
  isLearningGoal: boolean;
}

export interface DemandedSkill {
  skillId: string;
  name: string;
  category: string;
  /** How many of the analyzed jobs mention it. */
  jobCount: number;
  /** How many of those list it as required (not just nice-to-have). */
  requiredIn: number;
  percentOfJobs: number;
  /** have = saved skill (not a goal) or found in the resume; learning = saved as a learning goal. */
  status: 'have' | 'learning' | 'missing';
  inResume: boolean;
  priority: GapPriority | null;
  level: SkillLevel | null;
  progress: number | null;
}

export interface SkillGapResult {
  jobsAnalyzed: number;
  demanded: DemandedSkill[];
  gaps: DemandedSkill[];
  categories: { category: string; demanded: number; have: number }[];
}

export interface SkillGapInput {
  jobDescriptions: string[];
  catalog: CompiledSkill[];
  userSkills: Map<string, UserSkillState>;
  resumeText: string;
}

const PRIORITY_RANK: Record<GapPriority, number> = { high: 0, medium: 1, low: 2 };

export function priorityFor(percentOfJobs: number, requiredIn: number): GapPriority {
  if (percentOfJobs >= 40 || requiredIn >= 3) return 'high';
  if (percentOfJobs >= 20 || requiredIn >= 1) return 'medium';
  return 'low';
}

export function aggregateSkillGap({ jobDescriptions, catalog, userSkills, resumeText }: SkillGapInput): SkillGapResult {
  const resume = normalize(resumeText);
  const tally = new Map<string, { skill: CompiledSkill; jobCount: number; requiredIn: number }>();

  for (const description of jobDescriptions) {
    for (const { skill, required } of detectJobSkills(description, catalog)) {
      const entry = tally.get(skill.id) ?? { skill, jobCount: 0, requiredIn: 0 };
      entry.jobCount += 1;
      if (required > 0) entry.requiredIn += 1;
      tally.set(skill.id, entry);
    }
  }

  const jobsAnalyzed = jobDescriptions.length;
  const demanded: DemandedSkill[] = [...tally.values()].map(({ skill, jobCount, requiredIn }) => {
    const saved = userSkills.get(skill.id);
    const inResume = countMatches(skill.pattern, resume) > 0;
    const status: DemandedSkill['status'] = saved
      ? saved.isLearningGoal
        ? 'learning'
        : 'have'
      : inResume
        ? 'have'
        : 'missing';
    const percentOfJobs = jobsAnalyzed ? Math.round((jobCount / jobsAnalyzed) * 100) : 0;
    return {
      skillId: skill.id,
      name: skill.name,
      category: skill.category,
      jobCount,
      requiredIn,
      percentOfJobs,
      status,
      inResume,
      priority: status === 'have' ? null : priorityFor(percentOfJobs, requiredIn),
      level: saved?.level ?? null,
      progress: saved?.progress ?? null,
    };
  });

  demanded.sort((a, b) => b.jobCount - a.jobCount || b.requiredIn - a.requiredIn || a.name.localeCompare(b.name));

  const gaps = demanded
    .filter((s) => s.status !== 'have')
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority!] - PRIORITY_RANK[b.priority!] ||
        b.jobCount - a.jobCount ||
        b.requiredIn - a.requiredIn ||
        a.name.localeCompare(b.name),
    );

  const byCategory = new Map<string, { demanded: number; have: number }>();
  for (const s of demanded) {
    const entry = byCategory.get(s.category) ?? { demanded: 0, have: 0 };
    entry.demanded += 1;
    if (s.status === 'have') entry.have += 1;
    byCategory.set(s.category, entry);
  }
  const categories = [...byCategory.entries()]
    .map(([category, counts]) => ({ category, ...counts }))
    .sort((a, b) => b.demanded - a.demanded || a.category.localeCompare(b.category));

  return { jobsAnalyzed, demanded, gaps, categories };
}
