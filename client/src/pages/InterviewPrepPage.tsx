import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { GraduationCap, Play, Search, SearchX } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { SelectField } from '../components/ui/SelectField.tsx';
import { QuestionCard } from '../components/interviewPrep/QuestionCard.tsx';
import { UpgradeBanner } from '../components/billing/UpgradeBanner.tsx';
import { PracticeModal } from '../components/interviewPrep/PracticeModal.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { getPrepRecommendations, listQuestions, saveQuestionProgress } from '../services/interviewPrep.ts';
import { listAllApplications } from '../services/applications.ts';
import { CATEGORY_LABELS, DIFFICULTY_META, PRACTICE_STATUS_META } from '../lib/interviewPrepOptions.ts';
import { inputClasses } from '../lib/formStyles.ts';
import { cn } from '../lib/cn.ts';
import {
  PRACTICE_STATUSES,
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  type InterviewQuestion,
  type PracticeStatus,
  type QuestionCategory,
  type QuestionDifficulty,
} from '../types/interviewPrep.ts';

type CategoryFilter = 'recommended' | 'all' | QuestionCategory;

export function InterviewPrepPage() {
  useDocumentTitle('Interview prep');
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') ?? '';

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('recommended');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | ''>('');
  const [status, setStatus] = useState<PracticeStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [practicing, setPracticing] = useState(false);
  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim()), 300);

  const applications = useAsyncData(listAllApplications, 'prep-applications');
  const recommendations = useAsyncData(
    () => getPrepRecommendations(applicationId ? { applicationId } : {}),
    `prep-recommendations:${applicationId}`,
  );
  const recommended = recommendations.data?.recommendations.map((r) => r.category) ?? [];

  const categories: QuestionCategory[] | undefined =
    categoryFilter === 'all' ? undefined : categoryFilter === 'recommended' ? recommended : [categoryFilter];
  const questionsReady = categoryFilter !== 'recommended' || recommendations.data !== undefined;

  const questions = useAsyncData(
    () =>
      questionsReady
        ? listQuestions({ categories, difficulty: difficulty || undefined, status: status || undefined, search: search || undefined })
        : new Promise<never>(() => {}),
    JSON.stringify({ categories, difficulty, status, search, questionsReady }),
  );

  const updateLocal = (id: string, changes: Partial<InterviewQuestion>) =>
    questions.setData((current) => ({
      ...current,
      items: current.items.map((q) => (q.id === id ? { ...q, ...changes } : q)),
    }));

  const changeStatus = async (question: InterviewQuestion, next: PracticeStatus) => {
    updateLocal(question.id, { status: next });
    try {
      await saveQuestionProgress(question.id, { status: next });
      questions.reload();
    } catch (error) {
      updateLocal(question.id, { status: question.status });
      showToast(error instanceof Error ? error.message : 'Could not save', 'error');
    }
  };

  const saveNotes = async (question: InterviewQuestion, notes: string) => {
    await saveQuestionProgress(question.id, { notes: notes.trim() || null });
  };

  const stats = questions.data?.stats;
  const items = questions.data?.items ?? [];
  const context = recommendations.data?.context;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview preparation"
        description="Practise common technical, HR and behavioural questions — tailored to the job you're preparing for."
        actions={
          <Button onClick={() => setPracticing(true)} disabled={items.length === 0}>
            <Play className="size-4" aria-hidden="true" /> Practice {items.length > 0 ? `(${items.length})` : ''}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Prepare for a job" description="Pick an application to get questions that match its title and skills" />
          <div className="space-y-4 p-5">
            <SelectField
              label="Application"
              value={applicationId}
              onChange={(e) => {
                setSearchParams(e.target.value ? { applicationId: e.target.value } : {}, { replace: true });
                setCategoryFilter('recommended');
              }}
            >
              <option value="">General practice (based on your skills)</option>
              {[...(applications.data ?? [])]
                .sort((a, b) => a.company.name.localeCompare(b.company.name))
                .map((a) => (
                  <option key={a.id} value={a.id}>{a.company.name} — {a.jobTitle}</option>
                ))}
            </SelectField>
            {recommendations.error && <Alert tone="error">{recommendations.error.message}</Alert>}
            {recommendations.data && (
              <div>
                <p className="text-sm text-slate-600">
                  {context
                    ? <>Recommended for <strong className="text-slate-900">{context.jobTitle}</strong>{context.company && ` at ${context.company}`}:</>
                    : 'Recommended categories:'}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {recommendations.data.recommendations.map((r) => (
                    <li
                      key={r.category}
                      title={r.reasons.join(' · ')}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200 ring-inset"
                    >
                      {CATEGORY_LABELS[r.category]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Your progress" description={stats ? `${stats.confident} of ${stats.total} confident` : undefined} />
          {stats ? (
            <div className="space-y-4 p-5">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className="bg-emerald-500" style={{ width: `${(stats.confident / stats.total) * 100}%` }} />
                <div className="bg-sky-400" style={{ width: `${(stats.practicing / stats.total) * 100}%` }} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                {([['Confident', stats.confident, 'text-emerald-700'], ['Practicing', stats.practicing, 'text-sky-700'], ['Not started', stats.notStarted, 'text-slate-600']] as const).map(
                  ([label, value, color]) => (
                    <div key={label} className="rounded-lg bg-slate-50 py-2">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className={cn('text-lg font-semibold tabular-nums', color)}>{value}</dd>
                    </div>
                  ),
                )}
              </dl>
            </div>
          ) : (
            <Skeleton className="m-5 h-24" />
          )}
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          {(['recommended', 'all', ...QUESTION_CATEGORIES] as CategoryFilter[]).map((c) => {
            const catStats = stats?.byCategory.find((s) => s.category === c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={categoryFilter === c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ring-inset',
                  categoryFilter === c
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
                )}
              >
                {c === 'recommended' ? 'Recommended' : c === 'all' ? 'All' : CATEGORY_LABELS[c]}
                {catStats && <span className="ml-1.5 opacity-70">{catStats.confident}/{catStats.total}</span>}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_10rem]">
          <div className="relative">
            <label htmlFor="question-search" className="sr-only">Search questions</label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="question-search"
              type="search"
              placeholder="Search questions or skills…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                applySearch(e.target.value);
              }}
              className={inputClasses(false, 'pl-9')}
            />
          </div>
          <SelectField label="Difficulty" hideLabel value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty | '')}>
            <option value="">Any difficulty</option>
            {QUESTION_DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_META[d].label}</option>)}
          </SelectField>
          <SelectField label="Status" hideLabel value={status} onChange={(e) => setStatus(e.target.value as PracticeStatus | '')}>
            <option value="">Any status</option>
            {PRACTICE_STATUSES.map((s) => <option key={s} value={s}>{PRACTICE_STATUS_META[s].label}</option>)}
          </SelectField>
        </div>
      </div>

      {questions.data?.planLimited && (
        <UpgradeBanner>
          The Free plan includes the easy questions. Upgrade to Pro to unlock {questions.data.planLimited.lockedQuestions} medium and hard
          questions.
        </UpgradeBanner>
      )}

      {questions.error && (
        <Alert tone="error" title="Couldn't load questions">
          {questions.error.message}{' '}
          <button type="button" onClick={questions.reload} className="font-medium underline">Try again</button>
        </Alert>
      )}

      {!questions.data && !questions.error && (
        <div className="space-y-3" role="status" aria-label="Loading questions">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {questions.data && stats?.total === 0 && (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="The question bank is empty"
            description="Run the seed_interview_questions migration in Supabase to load the questions."
          />
        </Card>
      )}

      {questions.data && stats && stats.total > 0 && items.length === 0 && (
        <Card>
          <EmptyState icon={SearchX} title="No questions match these filters" description="Try another category or clear the search." />
        </Card>
      )}

      {items.length > 0 && (
        <ul className={cn('space-y-3 transition-opacity', questions.loading && 'opacity-60')}>
          {items.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onStatusChange={(question, next) => void changeStatus(question, next)}
              onNotesChange={saveNotes}
            />
          ))}
        </ul>
      )}

      <PracticeModal
        open={practicing}
        questions={items}
        onClose={() => {
          setPracticing(false);
          questions.reload();
        }}
        onRate={async (question, next) => {
          await saveQuestionProgress(question.id, { status: next });
        }}
      />
    </div>
  );
}
