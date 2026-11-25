import { z } from 'zod';

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

// PUT /api/skills/mine/:skillId — creates the skill for you or updates the fields you send.
export const upsertUserSkillSchema = z
  .object({
    level: z.enum(SKILL_LEVELS),
    progress: z.number().int('Must be a whole number').min(0).max(100),
    isLearningGoal: z.boolean(),
  })
  .partial()
  .strict();

export type UpsertUserSkillInput = z.infer<typeof upsertUserSkillSchema>;
