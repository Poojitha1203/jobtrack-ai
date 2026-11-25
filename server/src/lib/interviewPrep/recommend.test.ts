import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recommendCategories } from './recommend.js';

const categories = (result: ReturnType<typeof recommendCategories>) => result.map((r) => r.category);

describe('recommendCategories', () => {
  it('maps a frontend job title to frontend categories plus git, HR and behavioural', () => {
    assert.deepEqual(categories(recommendCategories({ jobTitle: 'Frontend Developer' })), [
      'javascript',
      'react',
      'html',
      'css',
      'git',
      'hr',
      'behavioral',
    ]);
  });

  it('uses skills from the job description and ranks by number of reasons', () => {
    const result = recommendCategories({ jobTitle: 'Backend Engineer', jobSkills: ['PostgreSQL', 'Node.js', 'Docker'] });
    assert.deepEqual(categories(result).slice(0, 3), ['nodejs', 'sql', 'rest_api']);
    assert.ok(result.find((r) => r.category === 'sql')?.reasons.includes('Job mentions PostgreSQL'));
  });

  it('ignores skills that have no question category', () => {
    const result = recommendCategories({ jobSkills: ['Docker', 'AWS'] });
    assert.deepEqual(categories(result), ['hr', 'behavioral']);
  });

  it("falls back to the user's own skills when there is no job", () => {
    const result = recommendCategories({ userSkills: ['React', 'SQL'] });
    assert.deepEqual(categories(result), ['react', 'sql', 'git', 'hr', 'behavioral']);
  });

  it('always returns HR and behavioural, even with no input', () => {
    assert.deepEqual(categories(recommendCategories({})), ['hr', 'behavioral']);
  });

  it('matches common title variations', () => {
    assert.ok(categories(recommendCategories({ jobTitle: 'Full Stack Developer (MERN)' })).includes('nodejs'));
    assert.ok(categories(recommendCategories({ jobTitle: 'SDE 1' })).includes('rest_api'));
    assert.ok(categories(recommendCategories({ jobTitle: 'Data Analyst' })).includes('sql'));
  });
});
