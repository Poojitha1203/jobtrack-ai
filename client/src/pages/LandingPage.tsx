import { Link } from 'react-router';
import {
  ArrowRight,
  ChartPie,
  CircleCheck,
  FileText,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  SquareKanban,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '../components/layout/Logo.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { cn } from '../lib/cn.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';

const REPO_URL = 'https://github.com/Poojitha1203/jobtrack-ai';

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: SquareKanban, title: 'Kanban pipeline', text: 'Drag applications from Wishlist to Offer and always know what needs your attention.' },
  { icon: Target, title: 'Job match analyzer', text: 'Paste a job description to see matching and missing skills with a transparent, rule-based score.' },
  { icon: ListChecks, title: 'Skill gap tracking', text: 'Turn missing skills into a learning plan and track progress from beginner to advanced.' },
  { icon: FileText, title: 'Resume manager', text: 'Keep multiple PDF resumes and record which version you sent to each company.' },
  { icon: GraduationCap, title: 'Interview prep', text: 'Practise questions on JavaScript, React, SQL, HR and more, with notes and progress.' },
  { icon: ChartPie, title: 'Career analytics', text: 'Response rates, interview conversion and which job sources actually work for you.' },
];

const STEPS = [
  { title: 'Save every opportunity', text: 'Add jobs with salary, location, source and the posting link — or park them on your wishlist.' },
  { title: 'Track each stage', text: 'Move applications through assessments and interviews, with reminders so nothing slips.' },
  { title: 'Improve with data', text: 'Spot skill gaps and weak channels, then focus your effort where it pays off.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    blurb: 'Everything you need to get organised.',
    features: ['Track up to 50 applications', 'Kanban board & reminders', 'Basic dashboard analytics', 'Basic job match analysis'],
    cta: 'Get started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹199',
    blurb: 'For an active, focused job search.',
    features: ['Unlimited applications', 'Advanced analytics', 'Resume analysis', 'Interview preparation', 'Advanced skill gap analysis'],
    cta: 'Start with Pro',
    highlighted: true,
  },
];

// Decorative mini-board used as the hero illustration (pure HTML/CSS, no image file).
const PREVIEW_COLUMNS = [
  { title: 'Applied', dot: 'bg-sky-500', cards: [['Frontend Developer', 'Lumen Labs'], ['React Developer', 'Northwind']] },
  { title: 'Interview', dot: 'bg-violet-500', cards: [['Software Engineer', 'Vertex Cloud'], ['UI Engineer', 'Quantive']] },
  { title: 'Offer', dot: 'bg-emerald-500', cards: [['Full Stack Dev', 'Greenleaf']] },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-linear-to-tr from-brand-200/60 via-violet-200/40 to-sky-200/50 blur-2xl" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-brand-900/5">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 h-2 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PREVIEW_COLUMNS.map((column) => (
            <div key={column.title} className="rounded-xl bg-slate-50 p-2.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className={cn('size-2 rounded-full', column.dot)} />
                {column.title}
              </p>
              <div className="space-y-2">
                {column.cards.map(([role, company]) => (
                  <div key={role} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <p className="truncate text-[11px] font-medium text-slate-800">{role}</p>
                    <p className="truncate text-[10px] text-slate-400">{company}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ['Response rate', '62%'],
            ['Interviews', '7'],
            ['Match score', '84%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-100 px-2.5 py-2">
              <p className="truncate text-[10px] text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  useDocumentTitle();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/" aria-label="JobTrack AI home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex" aria-label="Sections">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
              Log in
            </Link>
            <Link to="/register" className={buttonClasses({ size: 'sm' })}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-linear-to-b from-brand-50 to-white" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
            <div>
              <Badge tone="brand">Free & open source</Badge>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Your whole job search, <span className="text-brand-600">organised in one place.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-pretty text-slate-600">
                Track every application, prepare for interviews, close skill gaps and see what's
                working — without juggling spreadsheets, bookmarks and sticky notes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className={buttonClasses({ size: 'lg' })}>
                  Start tracking free <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link to="/dashboard" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
                  View demo dashboard
                </Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
                Your data stays private — protected by row-level security.
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-600">Features</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Everything between "found a job post" and "accepted the offer"
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Match scores are approximate and rule-based (keyword and skill comparison), not AI predictions.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-16 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-semibold text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Three steps to a calmer job search</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-brand-600">Pricing</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Start free, upgrade when you need more</h2>
              <p className="mt-3 text-sm text-slate-500">
                Payments run in Razorpay <strong>test mode</strong> — no real money is ever charged.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    'flex flex-col rounded-2xl border bg-white p-8 shadow-sm',
                    plan.highlighted ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    {plan.highlighted && <Badge tone="brand">Most popular</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{plan.blurb}</p>
                  <p className="mt-6">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500"> / month</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <CircleCheck className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={buttonClasses({
                      variant: plan.highlighted ? 'primary' : 'secondary',
                      className: 'mt-8 w-full',
                    })}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-3xl bg-linear-to-br from-brand-600 to-brand-900 px-6 py-14 text-center sm:px-12">
              <h2 className="text-3xl font-bold tracking-tight text-balance text-white">
                Ready to take control of your job search?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-brand-100">
                Create a free account in under a minute. No credit card required.
              </p>
              <Link
                to="/register"
                className={buttonClasses({
                  variant: 'secondary',
                  size: 'lg',
                  className: 'mt-8 text-brand-700 ring-0',
                })}
              >
                Create free account <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} JobTrack AI · Built with React, Express and Supabase</p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium hover:text-slate-900">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
