import { useId, useState } from 'react';
import { Flag, Trash2 } from 'lucide-react';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { cn } from '../../lib/cn.ts';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.ts';
import { SKILL_LEVELS, type UserSkill, type UserSkillChanges } from '../../types/skill.ts';

const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

interface MySkillCardProps {
  skill: UserSkill;
  onSave: (skill: UserSkill, changes: UserSkillChanges) => void;
  onRemove: (skill: UserSkill) => void;
}

export function MySkillCard({ skill, onSave, onRemove }: MySkillCardProps) {
  const sliderId = useId();
  // Local value so the slider moves smoothly; the save waits until dragging pauses.
  const [progress, setProgress] = useState(skill.progress);
  const saveProgress = useDebouncedCallback((value: number) => onSave(skill, { progress: value }), 600);

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{skill.name}</p>
          <p className="truncate text-xs text-slate-500">{skill.category}</p>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onSave(skill, { isLearningGoal: !skill.isLearningGoal })}
            aria-pressed={skill.isLearningGoal}
            aria-label={skill.isLearningGoal ? `Remove ${skill.name} from learning goals` : `Make ${skill.name} a learning goal`}
            title={skill.isLearningGoal ? 'Learning goal' : 'Mark as learning goal'}
            className={buttonClasses({
              variant: 'ghost',
              size: 'icon',
              className: cn('size-7', skill.isLearningGoal ? 'text-brand-600' : 'text-slate-300 hover:text-slate-500'),
            })}
          >
            <Flag className={cn('size-3.5', skill.isLearningGoal && 'fill-current')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(skill)}
            aria-label={`Remove ${skill.name}`}
            className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600' })}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={sliderId} className="text-slate-500">Progress</label>
          <span className="font-medium text-slate-700 tabular-nums">{progress}%</span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => {
            const value = Number(e.target.value);
            setProgress(value);
            saveProgress(value);
          }}
          className="mt-1 w-full accent-brand-600"
        />
      </div>

      <label className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
        Level
        <select
          value={skill.level}
          onChange={(e) => onSave(skill, { level: e.target.value as UserSkill['level'] })}
          className="rounded-md border-0 bg-slate-50 py-1 pr-7 pl-2 text-xs text-slate-700 ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-brand-600"
        >
          {SKILL_LEVELS.map((l) => (
            <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
          ))}
        </select>
      </label>
    </li>
  );
}
