export interface CatalogSkill {
  id: string;
  name: string;
  category: string;
  aliases: string[];
}

export interface CompiledSkill extends CatalogSkill {
  pattern: RegExp;
}

/** Lowercase, unify quotes/dashes, and treat "problem-solving" like "problem solving". Keeps line breaks. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, ' - ')
    .replace(/_/g, ' ')
    .replace(/([a-z])-(?=[a-z])/g, '$1 ')
    .replace(/[ \t]+/g, ' ');
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * One regex per skill that matches its name or any alias as a whole term.
 * The look-arounds stop "java" matching inside "javascript", "sql" inside "postgresql" and
 * "js" inside "node.js", while still allowing "c++", "c#" and ".net".
 */
export function compileSkill(skill: CatalogSkill): CompiledSkill {
  const terms = [...new Set([skill.name, ...skill.aliases].map((t) => normalize(t).trim()).filter((t) => t.length >= 2))];
  terms.sort((a, b) => b.length - a.length);
  const alternation = terms.map(escapeRegExp).join('|');
  return { ...skill, pattern: new RegExp(`(?<![a-z0-9+#.])(?:${alternation})(?![a-z0-9+#])`, 'g') };
}

export const countMatches = (pattern: RegExp, text: string) => text.match(pattern)?.length ?? 0;

export const STOPWORDS = new Set(
  (
    'a about above across after again all also am an and any are as at be because been being both but by can could did do does ' +
    'doing during each etc for from further get had has have having he her here how i if in into is it its just like make may ' +
    'more most must my need needs new no nor not of off on once one only or other our out over own per plus same she should so ' +
    'some such than that the their them then there these they this those through to too under until up us use using very was we ' +
    'well were what when where which while who whom why will with within would you your yours ' +
    // generic job-posting words that say nothing about the role
    'ability able apply applicants benefits candidate candidates company culture day days environment equal excellent experience ' +
    'experienced familiarity familiar good great help including join knowledge looking opportunity opportunities position preferred ' +
    'required requirements responsibilities role skills strong team teams understanding work working year years plus bonus ' +
    'nice have ideal someone across based build building ensure etc high including key level related support within every'
  ).split(/\s+/),
);
