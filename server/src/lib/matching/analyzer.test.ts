import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMatch } from './analyzer.js';
import { compileSkill, normalize, type CatalogSkill } from './text.js';

const skill = (name: string, category: string, aliases: string[] = []): CatalogSkill => ({ id: name, name, category, aliases });

const catalog = [
  skill('JavaScript', 'Programming languages', ['js', 'es6']),
  skill('Java', 'Programming languages'),
  skill('React', 'Frontend', ['react.js', 'reactjs']),
  skill('Node.js', 'Backend', ['node', 'nodejs']),
  skill('SQL', 'Databases'),
  skill('PostgreSQL', 'Databases', ['postgres']),
  skill('Docker', 'Cloud & DevOps'),
  skill('C++', 'Programming languages', ['cpp']),
  skill('C#', 'Programming languages'),
  skill('.NET', 'Backend', ['dotnet', 'asp.net']),
  skill('Problem solving', 'Soft skills', ['problem-solving']),
  skill('CI/CD', 'Cloud & DevOps', ['continuous integration']),
].map(compileSkill);

const analyze = (jobDescription: string, resumeText = '', profileSkills: string[] = []) =>
  analyzeMatch({ jobDescription, resumeText, profileSkills, catalog });

const names = (hits: { name: string }[]) => hits.map((h) => h.name).sort();

describe('skill detection', () => {
  it('does not match Java inside JavaScript', () => {
    const result = analyze('We use JavaScript every day.');
    assert.deepEqual(names([...result.matched, ...result.missing]), ['JavaScript']);
  });

  it('does not match SQL inside PostgreSQL', () => {
    const result = analyze('Experience with PostgreSQL.');
    assert.deepEqual(names(result.missing), ['PostgreSQL']);
  });

  it('matches aliases like react.js and nodejs', () => {
    const result = analyze('Required: React and Node.js', 'Built apps with react.js and nodejs');
    assert.deepEqual(names(result.matched), ['Node.js', 'React']);
  });

  it('does not count the "js" in Node.js as JavaScript', () => {
    const result = analyze('Node.js and React.js');
    assert.deepEqual(names(result.missing), ['Node.js', 'React']);
  });

  it('handles symbols in C++, C# and .NET', () => {
    const result = analyze('Must know C++, C# and .NET');
    assert.deepEqual(names(result.missing), ['.NET', 'C#', 'C++']);
  });

  it('treats hyphenated and spaced phrases the same', () => {
    assert.equal(normalize('problem-solving'), 'problem solving');
    const result = analyze('Strong problem solving skills', 'Known for problem-solving');
    assert.deepEqual(names(result.matched), ['Problem solving']);
  });

  it('matches multi-word aliases and slashes', () => {
    const result = analyze('Experience with continuous integration', 'Set up CI/CD pipelines');
    assert.deepEqual(names(result.matched), ['CI/CD']);
  });
});

describe('required vs preferred', () => {
  const jd = ['Requirements:', '- React', '- Node.js', '', 'Nice to have:', '- Docker', '- PostgreSQL'].join('\n');

  it('labels skills under a "Nice to have" heading as preferred', () => {
    const result = analyze(jd);
    const importance = Object.fromEntries(result.missing.map((s) => [s.name, s.importance]));
    assert.deepEqual(importance, { React: 'required', 'Node.js': 'required', Docker: 'preferred', PostgreSQL: 'preferred' });
  });

  it('marks an inline "is a plus" mention as preferred without changing later lines', () => {
    const result = analyze('Docker experience is a plus.\nYou will build features in React.');
    const importance = Object.fromEntries(result.missing.map((s) => [s.name, s.importance]));
    assert.deepEqual(importance, { Docker: 'preferred', React: 'required' });
  });

  it('only downgrades the sentence that says "is a plus"', () => {
    const result = analyze('Must have React and Node.js. Docker is a plus.');
    const importance = Object.fromEntries(result.missing.map((s) => [s.name, s.importance]));
    assert.deepEqual(importance, { React: 'required', 'Node.js': 'required', Docker: 'preferred' });
  });

  it('weights required skills more than preferred ones in the score', () => {
    // React 3 + Node 3 (required) + Docker 1 + PostgreSQL 1 (preferred) = 8; candidate has React + Docker = 4
    const result = analyze(jd, 'React and Docker');
    assert.equal(result.score, 50);
    assert.equal(result.level, 'moderate');
  });

  it('recommends required missing skills first', () => {
    const result = analyze(jd, 'Docker');
    assert.deepEqual(result.recommended.map((s) => s.name).slice(0, 2).sort(), ['Node.js', 'React']);
  });
});

describe('scoring and extras', () => {
  it('ignores every sentence of an "About us" line', () => {
    const result = analyze('About us: we are a startup. Our backend team uses Java.\nRequirements:\n- React');
    assert.deepEqual(names(result.missing), ['React']);
  });

  it('ignores technologies mentioned in an "About us" section', () => {
    const result = analyze('About us: our backend team uses Java.\nRequirements:\n- React');
    assert.deepEqual(names(result.missing), ['React']);
  });

  it('recommends technical skills before soft skills', () => {
    const soft = compileSkill(skill('Communication', 'Soft skills'));
    const result = analyzeMatch({ jobDescription: 'Communication skills\nCommunication\nDocker', resumeText: '', profileSkills: [], catalog: [...catalog, soft] });
    assert.equal(result.recommended[0]?.name, 'Docker');
  });

  it('does not repeat skill names in the keyword list', () => {
    const result = analyze('React React React dashboards dashboards');
    assert.ok(!result.keywords.some((k) => k.term === 'react'));
  });

  it('returns a null score when no known skills are found', () => {
    const result = analyze('We are a friendly company with free lunch.');
    assert.equal(result.score, null);
    assert.equal(result.level, null);
  });

  it('gives 100 when every skill is covered', () => {
    assert.equal(analyze('React and Node.js required', 'react nodejs').score, 100);
  });

  it('counts skills from the profile as matched', () => {
    const result = analyze('React and Docker required', 'React', ['Docker']);
    assert.equal(result.score, 100);
    assert.deepEqual(result.matched.find((s) => s.name === 'Docker')?.sources, ['profile']);
  });

  it('lists resume skills the job does not ask for', () => {
    const result = analyze('React required', 'React, Java, Docker');
    assert.deepEqual(names(result.extraSkills), ['Docker', 'Java']);
  });

  it('extracts the years of experience', () => {
    assert.equal(analyze('3+ years of React').experience, '3+ years');
    assert.equal(analyze('2-4 years experience with React').experience, '2–4 years');
    assert.equal(analyze('React developer').experience, null);
  });

  it('finds repeated keywords and whether the resume has them', () => {
    const result = analyze('Dashboards dashboards dashboards for analytics analytics.', 'I built dashboards');
    assert.deepEqual(result.keywords.slice(0, 2), [
      { term: 'dashboards', count: 3, inResume: true },
      { term: 'analytics', count: 2, inResume: false },
    ]);
  });
});
