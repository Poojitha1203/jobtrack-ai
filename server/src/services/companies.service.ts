import type { SupabaseClient } from '@supabase/supabase-js';
import { escapeLike } from '../utils/parse.js';
import type { CompanySummary } from '../types/api.js';

// Postgres error code for "unique constraint violated".
const UNIQUE_VIOLATION = '23505';

async function findByName(supabase: SupabaseClient, name: string): Promise<CompanySummary | null> {

  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', escapeLike(name))
    .limit(1)
    .maybeSingle<CompanySummary>();
  if (error) throw new Error(`Failed to look up company: ${error.message}`);
  return data;
}


export async function findOrCreateCompany(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<CompanySummary> {
  const existing = await findByName(supabase, name);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('companies')
    .insert({ user_id: userId, name })
    .select('id, name')
    .single<CompanySummary>();
  if (error?.code === UNIQUE_VIOLATION) {
    const winner = await findByName(supabase, name);
    if (winner) return winner;
  }
  if (error) throw new Error(`Failed to create company: ${error.message}`);
  return data;
}

export async function listCompanies(supabase: SupabaseClient): Promise<CompanySummary[]> {
  const { data, error } = await supabase.from('companies').select('id, name').order('name');
  if (error) throw new Error(`Failed to load companies: ${error.message}`);
  return data;
}
