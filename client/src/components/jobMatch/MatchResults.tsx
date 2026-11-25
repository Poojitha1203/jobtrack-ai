import { Check, Info, SearchX, X } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { Alert } from '../ui/Alert.tsx';
import { Badge } from '../ui/Badge.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { cn } from '../../lib/cn.ts';
import type { JobMatchResult, MatchLevel, SkillHit } from '../../types/jobMatch.ts';

const LEVELS: Record<MatchLevel, { label: string; ring: string; text: string }> = {
  strong: { label: 'Strong match', ring: 'stroke-emerald-500', text: 'text-emerald-700' },
  moderate: { label: 'Moderate match', ring: 'stroke-amber-500', text: 'text-amber-700' },
  low: { label: 'Low match', ring: 'stroke-rose-500', text: 'text-rose-700' },
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({ score, level }: { score: number; level: MatchLevel }) {
  return (
    <div className="relative size-36 shrink-0" role="img" aria-label={`Match score ${score} percent, ${LEVELS[level].label}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-slate-100" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={cn('transition-[stroke-dashoffset] duration-700', LEVELS[level].ring)}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-slate-900 tabular-nums">{score}%</span>
        <span className={cn('text-xs font-medium', LEVELS[level].text)}>{LEVELS[level].label}</span>
      </div>
    </div>
  );
}

function SkillChips({ skills, variant }: { skills: SkillHit[]; variant: 'have' | 'missing' }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((s) => {
        const preferred = s.importance === 'preferred';
        return (
          <li
            key={s.name}
            title={`${s.category} · mentioned ${s.mentions}×${s.sources.length ? ` · from your ${s.sources.join(' & ')}` : ''}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset',
              variant === 'have' && 'bg-emerald-50 text-emerald-800 ring-emerald-200',
              variant === 'missing' && !preferred && 'bg-rose-50 text-rose-800 ring-rose-200',
              variant === 'missing' && preferred && 'bg-amber-50 text-amber-900 ring-amber-200',
            )}
          >
            {variant === 'have' ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
            {s.name}
            {preferred && <span className="text-xs font-normal opacity-75">nice to have</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function MatchResults({ result }: { result: JobMatchResult }) {
  const jobSkillCount = result.matched.length + result.missing.length;

  if (result.score === null || !result.level) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="No known skills found in this description"
          description={`The analyzer looks for ${result.catalogSize} common tech and soft skills. Try pasting the full job description, including the requirements section.`}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreRing score={result.score} level={result.level} />
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <p className="text-lg font-semibold text-slate-900">
              You have {result.matched.length} of {jobSkillCount} skills this job mentions
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="danger">{result.missing.filter((s) => s.importance === 'required').length} required missing</Badge>
              <Badge tone="warning">{result.missing.filter((s) => s.importance === 'preferred').length} nice-to-have missing</Badge>
              {result.experience && <Badge tone="neutral">Asks for {result.experience}</Badge>}
            </div>
            <p className="flex items-start gap-1.5 text-left text-xs leading-relaxed text-slate-500">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Approximate, rule-based score — not an AI prediction. It compares skills from a catalog of {result.catalogSize}{' '}
              found in the job description with your resume and saved skills. Required skills count three times more than
              nice-to-haves.
            </p>
          </div>
        </div>
      </Card>

      {result.resume && !result.resume.hasText && (
        <Alert tone="warning" title="Your resume has no readable text">
          “{result.resume.title}” looks like a scanned PDF, so only your saved skills were compared. Upload a text-based PDF for a
          meaningful score.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Matching skills" description="Found in the job and in your resume or saved skills" />
          <div className="p-5">
            {result.matched.length ? <SkillChips skills={result.matched} variant="have" /> : <p className="text-sm text-slate-500">None yet.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Missing skills" description="Mentioned in the job but not found for you" />
          <div className="p-5">
            {result.missing.length ? <SkillChips skills={result.missing} variant="missing" /> : <p className="text-sm text-slate-500">Nothing missing 🎉</p>}
          </div>
        </Card>
      </div>

      {result.recommended.length > 0 && (
        <Card>
          <CardHeader title="Recommended to learn next" description="Missing skills ranked by how much they matter for this job" />
          <ol className="divide-y divide-slate-100">
            {result.recommended.map((s, i) => (
              <li key={s.name} className="flex items-center gap-4 px-5 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.category}</p>
                </div>
                <Badge tone={s.importance === 'required' ? 'danger' : 'warning'}>
                  {s.importance === 'required' ? 'Required' : 'Nice to have'}
                </Badge>
                <span className="hidden w-24 text-right text-xs text-slate-500 sm:block">mentioned {s.mentions}×</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Keyword analysis" description="Other frequent words in the job description" />
          {result.keywords.length ? (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">Keyword</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Mentions</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">In your resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.keywords.map((k) => (
                  <tr key={k.term}>
                    <td className="px-5 py-2 text-slate-900">{k.term}</td>
                    <td className="px-5 py-2 text-right text-slate-600 tabular-nums">{k.count}</td>
                    <td className="px-5 py-2 text-right">
                      {k.inResume ? (
                        <Check className="ml-auto size-4 text-emerald-600" aria-label="Yes" />
                      ) : (
                        <X className="ml-auto size-4 text-slate-300" aria-label="No" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-5 text-sm text-slate-500">No other notable keywords.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Also on your resume" description="Skills you have that this job doesn't mention" />
          <div className="p-5">
            {result.extraSkills.length ? (
              <ul className="flex flex-wrap gap-2">
                {result.extraSkills.map((s) => (
                  <li key={s.name}>
                    <Badge tone="neutral">{s.name}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">None found.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
