import { useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { Modal, ModalFooter } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { CATEGORY_LABELS, DIFFICULTY_META } from '../../lib/interviewPrepOptions.ts';
import type { InterviewQuestion, PracticeStatus } from '../../types/interviewPrep.ts';

interface PracticeModalProps {
  open: boolean;
  questions: InterviewQuestion[];
  onClose: () => void;
  onRate: (question: InterviewQuestion, status: PracticeStatus) => Promise<void>;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function PracticeSession({ questions, onClose, onRate }: Omit<PracticeModalProps, 'open'>) {
  // Shuffled once when the session starts; confident questions go last.
  const [deck] = useState(() => [
    ...shuffle(questions.filter((q) => q.status !== 'confident')),
    ...shuffle(questions.filter((q) => q.status === 'confident')),
  ]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState({ confident: 0, practicing: 0 });
  const [saving, setSaving] = useState(false);

  const current = deck[index];

  const next = () => {
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  const rate = async (status: 'practicing' | 'confident') => {
    if (!current) return;
    setSaving(true);
    try {
      await onRate(current, status);
      setRated((r) => ({ ...r, [status]: r[status] + 1 }));
      next();
    } finally {
      setSaving(false);
    }
  };

  if (!current) {
    return (
      <>
        <EmptyState
          icon={PartyPopper}
          title="Session complete"
          description={`You marked ${rated.confident} as confident and ${rated.practicing} to keep practising.`}
          className="py-10"
        />
        <ModalFooter>
          <Button onClick={onClose}>Done</Button>
        </ModalFooter>
      </>
    );
  }

  const difficulty = DIFFICULTY_META[current.difficulty];

  return (
    <>
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Question {index + 1} of {deck.length}</span>
          <div className="flex gap-1.5">
            <Badge tone="brand">{CATEGORY_LABELS[current.category]}</Badge>
            <Badge tone={difficulty.tone}>{difficulty.label}</Badge>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(index / deck.length) * 100}%` }} />
        </div>
        <p className="text-lg font-semibold text-slate-900">{current.question}</p>
        {revealed ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{current.suggestedAnswer}</p>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Answer out loud as if you were in the interview, then reveal the suggested answer.
          </p>
        )}
      </div>
      <ModalFooter>
        {revealed ? (
          <>
            <Button variant="secondary" onClick={() => void rate('practicing')} disabled={saving}>
              Keep practising
            </Button>
            <Button onClick={() => void rate('confident')} loading={saving}>
              I'm confident
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={next}>Skip</Button>
            <Button onClick={() => setRevealed(true)}>Show answer</Button>
          </>
        )}
      </ModalFooter>
    </>
  );
}

export function PracticeModal({ open, questions, onClose, onRate }: PracticeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Practice mode" description="Flashcards from your current filter" size="lg">
      <PracticeSession questions={questions} onClose={onClose} onRate={onRate} />
    </Modal>
  );
}
