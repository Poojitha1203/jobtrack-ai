import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Target } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { SelectField } from '../components/ui/SelectField.tsx';
import { TextAreaField } from '../components/ui/TextAreaField.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { MatchResults } from '../components/jobMatch/MatchResults.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { listResumes } from '../services/resumes.ts';
import { getApplication, listAllApplications } from '../services/applications.ts';
import { analyzeJobMatch } from '../services/jobMatch.ts';
import type { JobMatchResult } from '../types/jobMatch.ts';

const PASTE = 'paste';

export function JobMatchPage() {
  useDocumentTitle('Job match');
  const [searchParams] = useSearchParams();
  const resumes = useAsyncData(listResumes, 'job-match-resumes');
  const applications = useAsyncData(listAllApplications, 'job-match-applications');

  const [resumeChoice, setResumeChoice] = useState('');
  const [pastedResume, setPastedResume] = useState('');
  const [applicationId, setApplicationId] = useState(() => searchParams.get('applicationId') ?? '');
  const [jobDescription, setJobDescription] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(() => Boolean(searchParams.get('applicationId')));
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  const defaultResumeId = resumes.data?.find((r) => r.isDefault)?.id ?? resumes.data?.[0]?.id ?? PASTE;
  const selectedResume = resumeChoice || defaultResumeId;

  const loadDescription = (id: string) => {
    if (!id) return;
    setLoadingDescription(true);
    getApplication(id)
      .then((app) => setJobDescription(app.jobDescription ?? ''))
      .catch(() => setError("Couldn't load that application's description."))
      .finally(() => setLoadingDescription(false));
  };

  // Opened from an application page (?applicationId=…): pre-fill its description once.
  useEffect(() => {
    const id = searchParams.get('applicationId');
    if (!id) return;
    getApplication(id)
      .then((app) => setJobDescription(app.jobDescription ?? ''))
      .catch(() => setError("Couldn't load that application's description."))
      .finally(() => setLoadingDescription(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first load
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (jobDescription.trim().length < 30) return setError('Paste a job description of at least a few sentences.');
    if (selectedResume === PASTE && !pastedResume.trim()) return setError('Paste your resume text or choose an uploaded resume.');

    setAnalyzing(true);
    try {
      setResult(
        await analyzeJobMatch({
          jobDescription,
          ...(selectedResume === PASTE ? { resumeText: pastedResume } : { resumeId: selectedResume }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const appsWithDescriptions = [...(applications.data ?? [])].sort((a, b) => a.company.name.localeCompare(b.company.name));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job match analyzer"
        description="See how well your resume covers a job's skills — and what to learn next."
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="self-start xl:sticky xl:top-24 xl:col-span-2">
          <CardHeader title="Compare" description="Pick a resume and a job description" />
          <form onSubmit={handleSubmit} noValidate className="space-y-5 p-5">
            {error && <Alert tone="error">{error}</Alert>}

            {!resumes.data && !resumes.error ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <SelectField label="Resume" value={selectedResume} onChange={(e) => setResumeChoice(e.target.value)}>
                {resumes.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}{r.isDefault ? ' (default)' : ''}
                  </option>
                ))}
                <option value={PASTE}>Paste resume text instead…</option>
              </SelectField>
            )}
            {resumes.data?.length === 0 && (
              <p className="-mt-3 text-xs text-slate-500">
                No uploaded resumes yet — <Link to="/resumes" className="font-medium text-brand-600">upload one</Link> or paste the text.
              </p>
            )}
            {selectedResume === PASTE && (
              <TextAreaField
                label="Resume text"
                rows={6}
                value={pastedResume}
                maxLength={200_000}
                onChange={(e) => setPastedResume(e.target.value)}
              />
            )}

            <SelectField
              label="Load description from an application (optional)"
              value={applicationId}
              onChange={(e) => {
                setApplicationId(e.target.value);
                loadDescription(e.target.value);
              }}
            >
              <option value="">— Paste a description below —</option>
              {appsWithDescriptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company.name} — {a.jobTitle}
                </option>
              ))}
            </SelectField>

            <TextAreaField
              label="Job description"
              rows={12}
              value={jobDescription}
              maxLength={20000}
              disabled={loadingDescription}
              placeholder={loadingDescription ? 'Loading…' : 'Paste the full job posting, including requirements and nice-to-haves'}
              hint={applicationId && !loadingDescription && !jobDescription ? 'This application has no saved description — paste one here.' : undefined}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <Button type="submit" loading={analyzing} className="w-full">
              <Target className="size-4" aria-hidden="true" /> Analyze match
            </Button>
          </form>
        </Card>

        <div className="xl:col-span-3" aria-live="polite">
          {result ? (
            <MatchResults result={result} />
          ) : (
            <Card>
              <EmptyState
                icon={Target}
                title="Your match report will appear here"
                description="We'll highlight matching and missing skills, recommend what to learn next, and show key terms from the posting."
                className="py-16"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
