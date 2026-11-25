import { STOPWORDS, countMatches, normalize, type CompiledSkill } from './text.js';

export type Importance = 'required' | 'preferred';
export type MatchLevel = 'strong' | 'moderate' | 'low';

export interface SkillHit {
  name: string;
  category: string;
  importance: Importance;
  /** How many times the job description mentions it. */
  mentions: number;
  /** Where the candidate has it (empty for missing skills). */
  sources: ('resume' | 'profile')[];
}

export interface KeywordHit {
  term: string;
  count: number;
  inResume: boolean;
}

export interface MatchResult {
  /** 0–100, or null when no known skills were found in the job description. */
  score: number | null;
  level: MatchLevel | null;
  matched: SkillHit[];
  missing: SkillHit[];
  recommended: SkillHit[];
  /** Skills on the resume that this job doesn't ask for. */
  extraSkills: { name: string; category: string }[];
  keywords: KeywordHit[];
  /** e.g. "3+ years" or "2–4 years", when the description states it. */
  experience: string | null;
}

export interface AnalyzeInput {
  jobDescription: string;
  resumeText: string;
  /** Skill names from the user's profile (Skill Gap page). */
  profileSkills: string[];
  catalog: CompiledSkill[];
}

const PREFERRED_CUE = /\b(nice to have|preferred|bonus|good to have|a plus|desirable|would be great|optional)\b/;
const REQUIRED_CUE = /\b(requirements?|required|must have|qualifications|what you'll need|what you'll do|what we're looking for|responsibilities|about the role|your role|you have|you will|skills)\b/;
// Company blurbs and perks often name technologies the candidate isn't expected to know.
const CONTEXT_CUE = /^(about (us|the company|the team|our team)|who we are|our company|company overview|benefits|perks|what we offer)\b/;

const REQUIRED_WEIGHT = 3;
const PREFERRED_WEIGHT = 1;

/**
 * Splits the description into lines and labels each one required/preferred.
 * A heading like "Nice to have:" switches every following line until a "Requirements" style heading;
 * an inline "Docker is a plus" only marks that one line.
 */
type LineMode = Importance | 'context';

function labelLines(jobDescription: string): { text: string; importance: LineMode }[] {
  let mode: LineMode = 'required';
  return normalize(jobDescription)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => {
      const isHeading = text.length <= 60 && (text.endsWith(':') || !/[.!?]$/.test(text));
      if (CONTEXT_CUE.test(text)) {
        if (isHeading) mode = 'context';
        return { text, importance: 'context' as const };
      }
      if (PREFERRED_CUE.test(text)) {
        if (isHeading) mode = 'preferred';
        return { text, importance: 'preferred' as const };
      }
      if (isHeading && REQUIRED_CUE.test(text)) mode = 'required';
      return { text, importance: mode };
    });
}

const weightOf = (hit: SkillHit) =>
  (hit.importance === 'required' ? REQUIRED_WEIGHT : PREFERRED_WEIGHT) + Math.min(hit.mentions - 1, 2) * 0.5;

const byPriority = (a: SkillHit, b: SkillHit) =>
  weightOf(b) - weightOf(a) || b.mentions - a.mentions || a.name.localeCompare(b.name);

function extractExperience(text: string): string | null {
  const match = /(\d{1,2})\s*\+?\s*(?:(?:-|to)\s*(\d{1,2})\s*)?\+?\s*years?/.exec(text);
  if (!match) return null;
  const [, from, to] = match;
  return to ? `${from}–${to} years` : `${from}+ years`;
}

/** Frequent words that are NOT already covered by the skill list (skills are reported separately). */
function topKeywords(jobText: string, resumeText: string, skillWords: Set<string>, limit = 12): KeywordHit[] {
  const counts = new Map<string, number>();
  for (const raw of jobText.match(/[a-z][a-z0-9+#.]{2,}/g) ?? []) {
    const term = raw.replace(/\.+$/, '');
    if (term.length < 3 || STOPWORDS.has(term) || skillWords.has(term) || /^\d/.test(term)) continue;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const repeated = ranked.filter(([, count]) => count >= 2);
  return (repeated.length >= 5 ? repeated : ranked)
    .slice(0, limit)
    .map(([term, count]) => ({
      term,
      count,
      inResume: new RegExp(`(?<![a-z0-9])${term.replace(/[.+#]/g, '\\$&')}(?![a-z0-9])`).test(resumeText),
    }));
}

export function analyzeMatch({ jobDescription, resumeText, profileSkills, catalog }: AnalyzeInput): MatchResult {
  const lines = labelLines(jobDescription);
  const jobText = lines.map((l) => l.text).join('\n');
  const resume = normalize(resumeText);
  const profile = new Set(profileSkills.map((s) => s.toLowerCase()));

  const jobSkills: SkillHit[] = [];
  const extraSkills: MatchResult['extraSkills'] = [];

  const skillWords = new Set(
    catalog.flatMap((s) => [s.name, ...s.aliases]).flatMap((term) => normalize(term).split(/[\s/]+/)),
  );
  const skillText = lines.filter((l) => l.importance !== 'context');

  for (const skill of catalog) {
    let required = 0;
    let preferred = 0;
    for (const line of skillText) {
      const count = countMatches(skill.pattern, line.text);
      if (line.importance === 'required') required += count;
      else preferred += count;
    }
    const inResume = countMatches(skill.pattern, resume) > 0;
    const inProfile = profile.has(skill.name.toLowerCase());

    if (required + preferred === 0) {
      if (inResume) extraSkills.push({ name: skill.name, category: skill.category });
      continue;
    }
    const sources: SkillHit['sources'] = [];
    if (inResume) sources.push('resume');
    if (inProfile) sources.push('profile');
    jobSkills.push({
      name: skill.name,
      category: skill.category,
      importance: required > 0 ? 'required' : 'preferred',
      mentions: required + preferred,
      sources,
    });
  }

  const matched = jobSkills.filter((s) => s.sources.length > 0).sort(byPriority);
  const missing = jobSkills.filter((s) => s.sources.length === 0).sort(byPriority);

  const total = jobSkills.reduce((sum, s) => sum + weightOf(s), 0);
  const have = matched.reduce((sum, s) => sum + weightOf(s), 0);
  const score = total > 0 ? Math.round((have / total) * 100) : null;
  const level: MatchLevel | null = score === null ? null : score >= 75 ? 'strong' : score >= 50 ? 'moderate' : 'low';

  return {
    score,
    level,
    matched,
    missing,
    // Technical skills first: "learn Docker" is more actionable than "learn communication".
    recommended: [...missing].sort((a, b) => Number(a.category === 'Soft skills') - Number(b.category === 'Soft skills')).slice(0, 5),
    extraSkills: extraSkills.slice(0, 10),
    keywords: topKeywords(skillText.map((l) => l.text).join('\n'), resume, skillWords),
    experience: extractExperience(jobText),
  };
}
