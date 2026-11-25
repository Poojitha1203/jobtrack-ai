import { useId, useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import { cn } from '../../lib/cn.ts';
import { inputClasses } from '../../lib/formStyles.ts';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.ts';
import { CATEGORY_LABELS, DIFFICULTY_META, PRACTICE_STATUS_META } from '../../lib/interviewPrepOptions.ts';
import { PRACTICE_STATUSES, type InterviewQuestion, type PracticeStatus } from '../../types/interviewPrep.ts';

interface QuestionCardProps {
  question: InterviewQuestion;
  onStatusChange: (question: InterviewQuestion, status: PracticeStatus) => void;
  onNotesChange: (question: InterviewQuestion, notes: string) => Promise<void>;
}

export function QuestionCard({ question, onStatusChange, onNotesChange }: QuestionCardProps) {
  const panelId = useId();
  const notesId = useId();
  const [open, setOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [notes, setNotes] = useState(question.notes ?? '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saveNotes = useDebouncedCallback((value: string) => {
    setSaveState('saving');
    onNotesChange(question, value)
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('idle'));
  }, 800);

  const status = PRACTICE_STATUS_META[question.status];
  const difficulty = DIFFICULTY_META[question.difficulty];

  return (
    <li className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{question.question}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="brand">{CATEGORY_LABELS[question.category]}</Badge>
            <Badge tone={difficulty.tone}>{difficulty.label}</Badge>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
        </div>
        <ChevronDown className={cn('mt-1 size-5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className="space-y-4 border-t border-slate-100 p-4">
          <div>
            <button
              type="button"
              onClick={() => setShowAnswer((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {showAnswer ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              {showAnswer ? 'Hide suggested answer' : 'Show suggested answer'}
            </button>
            {!showAnswer && <p className="mt-1 text-xs text-slate-500">Try answering out loud first, then compare.</p>}
            {showAnswer && (
              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{question.suggestedAnswer}</p>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">How confident are you?</legend>
            <div className="mt-2 inline-flex rounded-lg bg-slate-100 p-1">
              {PRACTICE_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={question.status === s}
                  onClick={() => onStatusChange(question, s)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition sm:text-sm',
                    question.status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {PRACTICE_STATUS_META[s].label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={notesId} className="text-sm font-medium text-slate-700">My notes</label>
              <span className="text-xs text-slate-400" aria-live="polite">
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
              </span>
            </div>
            <textarea
              id={notesId}
              rows={3}
              maxLength={5000}
              value={notes}
              placeholder="Your own answer, an example from your projects, key points to remember…"
              onChange={(e) => {
                setNotes(e.target.value);
                setSaveState('idle');
                saveNotes(e.target.value);
              }}
              className={inputClasses(false, 'mt-1.5 resize-y')}
            />
          </div>

          {question.tags.length > 0 && <p className="text-xs text-slate-400">Related skills: {question.tags.join(', ')}</p>}
        </div>
      )}
    </li>
  );
}
