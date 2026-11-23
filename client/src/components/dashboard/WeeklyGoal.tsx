import { Target } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card.tsx';

interface WeeklyGoalProps {
  sent: number;
  goal: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Circular progress ring drawn with SVG: a grey track plus a coloured arc
// whose length is controlled by strokeDashoffset.
export function WeeklyGoal({ sent, goal }: WeeklyGoalProps) {
  const progress = goal > 0 ? Math.min(sent / goal, 1) : 0;
  const remaining = Math.max(goal - sent, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader title="Weekly goal" description="Applications sent since Monday" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6">
        <div className="relative size-36">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-slate-100" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="stroke-brand-600 transition-[stroke-dashoffset] duration-700"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-slate-900 tabular-nums">
              {sent}
              <span className="text-lg text-slate-400">/{goal}</span>
            </span>
            <span className="text-xs text-slate-500">{Math.round(progress * 100)}% done</span>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <Target className="size-4 text-brand-600" aria-hidden="true" />
          {remaining === 0 ? 'Goal reached — great work!' : `${remaining} more to hit this week's goal`}
        </p>
      </div>
    </Card>
  );
}
