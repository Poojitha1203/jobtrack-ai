import type { QuestionCategory } from '../../constants/interviewPrep.js';

export interface CategoryRecommendation {
  category: QuestionCategory;
  reasons: string[];
}

// Catalog skill name → question category it prepares you for.
const SKILL_CATEGORY: Record<string, QuestionCategory> = {
  JavaScript: 'javascript',
  TypeScript: 'javascript',
  React: 'react',
  'Next.js': 'react',
  Redux: 'react',
  'React Native': 'react',
  HTML: 'html',
  'Web accessibility': 'html',
  CSS: 'css',
  'Tailwind CSS': 'css',
  Sass: 'css',
  Bootstrap: 'css',
  'Responsive design': 'css',
  'Node.js': 'nodejs',
  'Express.js': 'nodejs',
  NestJS: 'nodejs',
  SQL: 'sql',
  PostgreSQL: 'sql',
  MySQL: 'sql',
  SQLite: 'sql',
  'REST APIs': 'rest_api',
  GraphQL: 'rest_api',
  Git: 'git',
  GitHub: 'git',
  GitLab: 'git',
};

const TITLE_RULES: { pattern: RegExp; label: string; categories: QuestionCategory[] }[] = [
  { pattern: /\b(front ?end|ui developer|ui engineer|web developer)\b/, label: 'Frontend role', categories: ['javascript', 'react', 'html', 'css'] },
  { pattern: /\b(back ?end|api developer|server)\b/, label: 'Backend role', categories: ['nodejs', 'sql', 'rest_api'] },
  { pattern: /\b(full ?stack|mern|mean|software (engineer|developer)|sde)\b/, label: 'Full-stack / software role', categories: ['javascript', 'react', 'nodejs', 'sql', 'rest_api'] },
  { pattern: /\breact\b/, label: 'React in the job title', categories: ['react', 'javascript'] },
  { pattern: /\bnode/, label: 'Node.js in the job title', categories: ['nodejs', 'javascript'] },
  { pattern: /\b(data|sql|analyst|database)\b/, label: 'Data-focused role', categories: ['sql'] },
];

const TECH_ORDER: QuestionCategory[] = ['javascript', 'react', 'html', 'css', 'nodejs', 'sql', 'rest_api', 'git'];

/**
 * Picks question categories for a job from its title and the skills found in its description.
 * HR and behavioural questions come up in almost every interview, so they're always included.
 */
export function recommendCategories(input: {
  jobTitle?: string | null;
  jobSkills?: string[];
  userSkills?: string[];
}): CategoryRecommendation[] {
  const reasons = new Map<QuestionCategory, Set<string>>();
  const add = (category: QuestionCategory, reason: string) => {
    reasons.set(category, (reasons.get(category) ?? new Set()).add(reason));
  };

  const title = (input.jobTitle ?? '').toLowerCase();
  for (const rule of TITLE_RULES) {
    if (rule.pattern.test(title)) rule.categories.forEach((c) => add(c, rule.label));
  }
  for (const skill of input.jobSkills ?? []) {
    const category = SKILL_CATEGORY[skill];
    if (category) add(category, `Job mentions ${skill}`);
  }
  // Without a job, fall back to the user's own skills.
  if (reasons.size === 0) {
    for (const skill of input.userSkills ?? []) {
      const category = SKILL_CATEGORY[skill];
      if (category) add(category, `In your skills: ${skill}`);
    }
  }
  if (reasons.size > 0 && !reasons.has('git')) add('git', 'Expected in most developer interviews');

  const technical = TECH_ORDER.filter((c) => reasons.has(c))
    .map((category) => ({ category, reasons: [...reasons.get(category)!] }))
    .sort((a, b) => b.reasons.length - a.reasons.length || TECH_ORDER.indexOf(a.category) - TECH_ORDER.indexOf(b.category));

  return [
    ...technical,
    { category: 'hr', reasons: ['Asked in almost every interview'] },
    { category: 'behavioral', reasons: ['Asked in almost every interview'] },
  ];
}
