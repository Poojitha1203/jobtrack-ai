import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAnalytics, type AnalyticsApplication, type AnalyticsInterview } from './compute.js';
import { compileSkill } from '../matching/text.js';

const catalog = [
  compileSkill({ id: 'react', name: 'React', category: 'Frontend', aliases: [] }),
  compileSkill({ id: 'sql', name: 'SQL', category: 'Databases', aliases: [] }),
];

const app = (status: AnalyticsApplication['status'], appliedAt: string | null, extra: Partial<AnalyticsApplication> = {}): AnalyticsApplication => ({
  status,
  appliedAt,
  createdAt: `${appliedAt ?? '2026-11-01'}T10:00:00Z`,
  source: null,
  companyName: 'Acme',
  jobDescription: null,
  ...extra,
});

const today = new Date(2026, 10, 25); // 25 Nov 2026

const applications: AnalyticsApplication[] = [
  app('applied', '2026-11-03', { source: 'LinkedIn', jobDescription: 'React and SQL required' }),
  app('interview', '2026-11-10', { source: 'linkedin', jobDescription: 'React' }),
  app('rejected', '2026-10-05', { source: 'Referral' }),
  app('offer', '2026-10-20', { source: 'Referral', jobDescription: 'React developer' }),
  app('wishlist', null),
  app('applied', '2026-03-01', { source: 'Naukri' }),
];

const interviews: AnalyticsInterview[] = [
  { companyName: 'Lumen', scheduledAt: '2026-11-12T05:00:00Z', result: 'passed' },
  { companyName: 'Lumen', scheduledAt: '2026-11-20T05:00:00Z', result: 'pending' },
  { companyName: 'Vertex', scheduledAt: '2026-10-25T05:00:00Z', result: 'failed' },
];

const run = (months: number) => computeAnalytics({ applications, interviews, catalog, months, today });

describe('computeAnalytics', () => {
  it('calculates summary rates from submitted applications', () => {
    const { summary } = run(0);
    assert.deepEqual(
      { ...summary },
      {
        total: 6,
        submitted: 5,
        responded: 3,
        interviewed: 2,
        offers: 1,
        rejected: 1,
        interviewsScheduled: 3,
        responseRate: 60,
        interviewRate: 40,
        successRate: 20,
        interviewToOfferRate: 50,
      },
    );
  });

  it('limits everything to the selected number of months', () => {
    const result = run(2);
    assert.equal(result.summary.submitted, 4);
    assert.deepEqual(result.byMonth.map((m) => m.month), ['2026-10', '2026-11']);
  });

  it('buckets applications and interviews per month with a null rate for empty months', () => {
    const result = run(3);
    assert.deepEqual(
      result.byMonth.map((m) => [m.month, m.applications, m.interviews, m.responseRate]),
      [
        ['2026-09', 0, 0, null],
        ['2026-10', 2, 1, 100],
        ['2026-11', 2, 2, 50],
      ],
    );
  });

  it('starts the all-time chart at the earliest record', () => {
    assert.equal(run(0).byMonth[0]?.month, '2026-03');
  });

  it('counts interviews per company with passes', () => {
    assert.deepEqual(run(0).interviewsByCompany, [
      { company: 'Lumen', interviews: 2, passed: 1 },
      { company: 'Vertex', interviews: 1, passed: 0 },
    ]);
  });

  it('ranks skills by how many job descriptions mention them', () => {
    const result = run(0);
    assert.equal(result.jobsWithDescriptions, 3);
    assert.deepEqual(result.topSkills, [
      { skill: 'React', jobs: 3, percent: 100 },
      { skill: 'SQL', jobs: 1, percent: 33 },
    ]);
  });

  it('groups sources case-insensitively and measures their effectiveness', () => {
    const bySource = Object.fromEntries(run(0).sources.map((s) => [s.source, [s.applications, s.responseRate, s.interviewRate, s.offers]]));
    assert.deepEqual(bySource, {
      LinkedIn: [2, 50, 50, 0],
      Referral: [2, 100, 50, 1],
      Naukri: [1, 0, 0, 0],
    });
  });

  it('keeps status counts in pipeline order', () => {
    assert.deepEqual(run(0).byStatus.map((s) => s.status), ['wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected']);
  });

  it('handles no data', () => {
    const result = computeAnalytics({ applications: [], interviews: [], catalog, months: 6, today });
    assert.equal(result.summary.responseRate, 0);
    assert.equal(result.byMonth.length, 6);
    assert.deepEqual(result.topSkills, []);
  });
});
