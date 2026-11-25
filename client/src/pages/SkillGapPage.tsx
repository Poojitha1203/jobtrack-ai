import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { BookOpenCheck, CircleCheck, ListChecks, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Badge, type BadgeTone } from '../components/ui/Badge.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { SelectField } from '../components/ui/SelectField.tsx';
import { TextField } from '../components/ui/TextField.tsx';
import { MySkillCard } from '../components/skills/MySkillCard.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { getSkillGap, listMySkills, listSkillCatalog, removeMySkill, saveMySkill } from '../services/skills.ts';
import { SKILL_LEVELS, type DemandedSkill, type GapPriority, type SkillLevel, type UserSkill, type UserSkillChanges } from '../types/skill.ts';

const PRIORITY: Record<GapPriority, { label: string; tone: BadgeTone }> = {
  high: { label: 'High priority', tone: 'danger' },
  medium: { label: 'Medium', tone: 'warning' },
  low: { label: 'Low', tone: 'neutral' },
};

const LEVEL_COLUMNS: { level: SkillLevel; title: string; hint: string }[] = [
  { level: 'beginner', title: 'Beginner', hint: 'Learning the basics' },
  { level: 'intermediate', title: 'Intermediate', hint: 'Comfortable on real projects' },
  { level: 'advanced', title: 'Advanced', hint: 'Could teach or lead with it' },
];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
    </Card>
  );
}

function GapRow({ skill, onLearn, onHave }: { skill: DemandedSkill; onLearn: () => void; onHave: () => void }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{skill.name}</p>
          {skill.priority && <Badge tone={PRIORITY[skill.priority].tone}>{PRIORITY[skill.priority].label}</Badge>}
          {skill.status === 'learning' && <Badge tone="brand">Learning · {skill.progress ?? 0}%</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {skill.category} · in {skill.jobCount} job{skill.jobCount === 1 ? '' : 's'} ({skill.percentOfJobs}%)
          {skill.requiredIn > 0 && ` · required by ${skill.requiredIn}`}
        </p>
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${skill.percentOfJobs}%` }} />
        </div>
      </div>
      {skill.status === 'missing' && (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={onLearn}>
            <BookOpenCheck className="size-4" aria-hidden="true" /> Start learning
          </Button>
          <Button size="sm" variant="secondary" onClick={onHave}>
            I have this
          </Button>
        </div>
      )}
    </li>
  );
}

export function SkillGapPage() {
  useDocumentTitle('Skill gap');
  const showToast = useToast();
  const gap = useAsyncData(getSkillGap, 'skill-gap');
  const mine = useAsyncData(listMySkills, 'my-skills');
  const catalog = useAsyncData(listSkillCatalog, 'skill-catalog');
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState<SkillLevel>('intermediate');
  const [addError, setAddError] = useState<string>();

  const refresh = () => {
    mine.reload();
    gap.reload();
  };

  const save = async (skillId: string, changes: UserSkillChanges, message?: string) => {
    try {
      await saveMySkill(skillId, changes);
      if (message) showToast(message);
      refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save', 'error');
    }
  };

  const remove = async (skill: UserSkill) => {
    try {
      await removeMySkill(skill.skillId);
      showToast(`Removed ${skill.name}`);
      refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not remove', 'error');
    }
  };

  const addSkill = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const match = catalog.data?.find((s) => s.name.toLowerCase() === newSkill.trim().toLowerCase());
    if (!match) return setAddError('Pick a skill from the suggestions');
    if (mine.data?.some((s) => s.skillId === match.id)) return setAddError('Already in your skills');
    setAddError(undefined);
    setNewSkill('');
    void save(match.id, { level: newLevel, progress: newLevel === 'advanced' ? 100 : newLevel === 'intermediate' ? 60 : 20 }, `Added ${match.name}`);
  };

  const report = gap.data;
  const haveCount = report?.demanded.filter((s) => s.status === 'have').length ?? 0;
  const learningGoals = mine.data?.filter((s) => s.isLearningGoal) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill gap analyzer"
        description="What your target jobs ask for, what you already have, and what to learn next."
      />

      {(gap.error || mine.error) && (
        <Alert tone="error" title="Couldn't load your skill data">
          {(gap.error ?? mine.error)?.message}{' '}
          <button type="button" onClick={refresh} className="font-medium underline">Try again</button>
        </Alert>
      )}

      {!report && !gap.error ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" role="status" aria-label="Loading">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : report && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Job descriptions analyzed" value={report.jobsAnalyzed} />
          <Stat label="Skills in demand" value={report.demanded.length} />
          <Stat label="You already have" value={haveCount} />
          <Stat label="Gaps to close" value={report.gaps.filter((s) => s.status === 'missing').length} />
        </div>
      )}

      {report && report.jobsAnalyzed === 0 && (
        <Alert tone="info" title="No job descriptions yet">
          Paste job descriptions into your <Link to="/applications" className="font-medium underline">applications</Link> — the
          analyzer reads them to find which skills your target jobs ask for.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="self-start overflow-hidden xl:col-span-2">
          <CardHeader
            title="Learning priorities"
            description={
              report?.resumeTitle
                ? `Skills your jobs mention that aren't in your saved skills or “${report.resumeTitle}”`
                : "Skills your jobs mention that aren't in your saved skills or default resume"
            }
          />
          {report && report.gaps.length === 0 && report.jobsAnalyzed > 0 && (
            <EmptyState icon={CircleCheck} title="No gaps found" description="You cover every skill your saved jobs mention." />
          )}
          {report && report.gaps.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 border-t border-slate-100">
              {report.gaps.slice(0, 15).map((skill) => (
                <GapRow
                  key={skill.skillId}
                  skill={skill}
                  onLearn={() => void save(skill.skillId, { level: 'beginner', progress: 0, isLearningGoal: true }, `${skill.name} added to learning goals`)}
                  onHave={() => void save(skill.skillId, { level: 'intermediate', progress: 60, isLearningGoal: false }, `${skill.name} added to your skills`)}
                />
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Demand by category" />
            <ul className="space-y-3 p-5">
              {report?.categories.map((c) => (
                <li key={c.category}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.category}</span>
                    <span className="text-slate-500 tabular-nums">{c.have}/{c.demanded} covered</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-rose-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c.have / c.demanded) * 100}%` }} />
                  </div>
                </li>
              ))}
              {report?.categories.length === 0 && <li className="text-sm text-slate-500">No data yet.</li>}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Learning goals" description={`${learningGoals.length} in progress`} />
            <ul className="space-y-3 p-5">
              {learningGoals.map((s) => (
                <li key={s.skillId}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="text-slate-500 tabular-nums">{s.progress}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${s.progress}%` }} />
                  </div>
                </li>
              ))}
              {learningGoals.length === 0 && (
                <li className="text-sm text-slate-500">Use “Start learning” on a gap, or the flag on one of your skills.</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="My skills" description="Grouped by level. Drag the slider to track progress." />
        <form onSubmit={addSkill} noValidate className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <TextField
            label="Add a skill"
            list="skill-catalog-options"
            placeholder="Start typing, e.g. React"
            value={newSkill}
            error={addError}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <datalist id="skill-catalog-options">
            {catalog.data?.map((s) => <option key={s.id} value={s.name}>{s.category}</option>)}
          </datalist>
          <SelectField label="Level" value={newLevel} onChange={(e) => setNewLevel(e.target.value as SkillLevel)}>
            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l[0]!.toUpperCase() + l.slice(1)}</option>)}
          </SelectField>
          <Button type="submit" className="sm:mb-[1px]">
            <Plus className="size-4" aria-hidden="true" /> Add
          </Button>
        </form>

        {mine.data?.length === 0 ? (
          <EmptyState icon={ListChecks} title="No skills saved yet" description="Add the skills you already have — they count towards your job match scores too." />
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {LEVEL_COLUMNS.map((col) => {
              const skills = mine.data?.filter((s) => s.level === col.level) ?? [];
              return (
                <section key={col.level} aria-label={`${col.title} skills`} className="rounded-xl bg-slate-50 p-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {col.title} <span className="font-normal text-slate-400">· {skills.length}</span>
                  </h3>
                  <p className="text-xs text-slate-500">{col.hint}</p>
                  <ul className="mt-3 space-y-2">
                    {skills.map((s) => (
                      <MySkillCard
                        key={`${s.skillId}-${s.updatedAt}`}
                        skill={s}
                        onSave={(skill, changes) => void save(skill.skillId, changes)}
                        onRemove={(skill) => void remove(skill)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
