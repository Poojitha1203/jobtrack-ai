import type { SupabaseClient } from '@supabase/supabase-js';
import { compileSkill, type CatalogSkill, type CompiledSkill } from '../lib/matching/text.js';

// The catalog is the same for every user and rarely changes, so keep compiled regexes in memory.
const CACHE_MS = 10 * 60 * 1000;
let cache: { loadedAt: number; skills: CompiledSkill[] } | null = null;

export async function getSkillCatalog(supabase: SupabaseClient): Promise<CompiledSkill[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_MS) return cache.skills;

  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category, aliases')
    .order('name')
    .returns<CatalogSkill[]>();
  if (error) throw new Error(`Failed to load skill catalog: ${error.message}`);

  const skills = data.map(compileSkill);
  if (skills.length > 0) cache = { loadedAt: Date.now(), skills };
  return skills;
}
