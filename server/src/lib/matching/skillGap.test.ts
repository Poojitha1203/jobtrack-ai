import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateSkillGap, priorityFor, type UserSkillState } from './skillGap.js';
import { compileSkill, type CatalogSkill } from './text.js';

const skill = (name: string, category: string, aliases: string[] = []): CatalogSkill => ({ id: name, name, category, aliases });

const catalog = [
  skill('React', 'Frontend', ['react.js']),
  skill('TypeScript', 'Programming languages'),
  skill('Docker', 'Cloud & DevOps'),
  skill('AWS', 'Cloud & DevOps'),
  skill('GraphQL', 'Backend'),
].map(compileSkill);

const jobs = [
  'Requirements:\n- React\n- TypeScript\nNice to have:\n- Docker',
  'Must have React and TypeScript. Docker is a plus.',
  'Requirements:\n- React.js\n- AWS',
  'Requirements:\n- React\nNice to have:\n- GraphQL',
];

const run = (userSkills = new Map<string, UserSkillState>(), resumeText = '') =>
  aggregateSkillGap({ jobDescriptions: jobs, catalog, userSkills, resumeText });

describe('aggregateSkillGap', () => {
  it('counts how many jobs mention each skill and how many require it', () => {
    const result = run();
    const byName = Object.fromEntries(result.demanded.map((s) => [s.name, [s.jobCount, s.requiredIn, s.percentOfJobs]]));
    assert.deepEqual(byName, {
      React: [4, 4, 100],
      TypeScript: [2, 2, 50],
      Docker: [2, 0, 50],
      AWS: [1, 1, 25],
      GraphQL: [1, 0, 25],
    });
    assert.equal(result.jobsAnalyzed, 4);
  });

  it('sorts demand by number of jobs', () => {
    assert.equal(run().demanded[0]?.name, 'React');
  });

  it('uses saved skills and the resume to decide what you already have', () => {
    const saved = new Map<string, UserSkillState>([
      ['React', { level: 'advanced', progress: 100, isLearningGoal: false }],
      ['Docker', { level: 'beginner', progress: 20, isLearningGoal: true }],
    ]);
    const result = run(saved, 'I write TypeScript every day');
    const status = Object.fromEntries(result.demanded.map((s) => [s.name, s.status]));
    assert.deepEqual(status, { React: 'have', TypeScript: 'have', Docker: 'learning', AWS: 'missing', GraphQL: 'missing' });
    assert.equal(result.demanded.find((s) => s.name === 'Docker')?.progress, 20);
  });

  it('lists gaps by priority, including skills you are learning', () => {
    const saved = new Map<string, UserSkillState>([['React', { level: 'advanced', progress: 100, isLearningGoal: false }]]);
    const gaps = run(saved).gaps.map((s) => `${s.name}:${s.priority}`);
    assert.deepEqual(gaps, ['TypeScript:high', 'Docker:high', 'AWS:medium', 'GraphQL:medium']);
  });

  it('summarises demand per category', () => {
    const saved = new Map<string, UserSkillState>([['Docker', { level: 'beginner', progress: 0, isLearningGoal: false }]]);
    const devops = run(saved).categories.find((c) => c.category === 'Cloud & DevOps');
    assert.deepEqual(devops, { category: 'Cloud & DevOps', demanded: 2, have: 1 });
  });

  it('handles having no job descriptions', () => {
    const result = aggregateSkillGap({ jobDescriptions: [], catalog, userSkills: new Map(), resumeText: '' });
    assert.deepEqual(result, { jobsAnalyzed: 0, demanded: [], gaps: [], categories: [] });
  });
});

describe('priorityFor', () => {
  it('ranks by share of jobs and required mentions', () => {
    assert.equal(priorityFor(40, 0), 'high');
    assert.equal(priorityFor(10, 3), 'high');
    assert.equal(priorityFor(20, 0), 'medium');
    assert.equal(priorityFor(5, 1), 'medium');
    assert.equal(priorityFor(5, 0), 'low');
  });
});
