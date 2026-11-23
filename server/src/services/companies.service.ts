import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '../utils/HttpError.js';
import { escapeLike, sanitizeSearchTerm } from '../utils/parse.js';
import type { CompanyResponse, CompanySummary } from '../types/api.js';
import type { CreateCompanyInput, ListCompaniesQuery, UpdateCompanyInput } from '../validators/company.schema.js';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const NO_ROWS = 'PGRST116';

interface CompanyRow {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  applications?: { count: number }[];
}

// applications(count) asks PostgREST for the number of related rows, not the rows themselves.
const COLUMNS =
  'id, name, website, location, industry, contact_name, contact_email, notes, created_at, updated_at, applications(count)';

const toResponse = (row: CompanyRow): CompanyResponse => ({
  id: row.id,
  name: row.name,
  website: row.website,
  location: row.location,
  industry: row.industry,
  contactName: row.contact_name,
  contactEmail: row.contact_email,
  notes: row.notes,
  applicationCount: row.applications?.[0]?.count ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function toColumns(input: UpdateCompanyInput) {
  const map: Record<string, string> = {
    name: 'name',
    website: 'website',
    location: 'location',
    industry: 'industry',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    notes: 'notes',
  };
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = map[key];
    if (column && value !== undefined) columns[column] = value;
  }
  return columns;
}

const duplicateName = () =>
  new HttpError(409, 'You already have a company with this name', { name: ['A company with this name already exists'] });

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

export async function listCompanies(supabase: SupabaseClient, query: ListCompaniesQuery): Promise<CompanyResponse[]> {
  let request = supabase.from('companies').select(COLUMNS);
  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) {
      request = request.or(
        ['name', 'industry', 'location', 'contact_name'].map((col) => `${col}.ilike.*${term}*`).join(','),
      );
    }
  }
  const { data, error } = await request.order('name').returns<CompanyRow[]>();
  if (error) throw new Error(`Failed to load companies: ${error.message}`);
  return data.map(toResponse);
}

export async function getCompany(supabase: SupabaseClient, id: string): Promise<CompanyResponse> {
  const { data, error } = await supabase.from('companies').select(COLUMNS).eq('id', id).single<CompanyRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Company not found');
  if (error) throw new Error(`Failed to load company: ${error.message}`);
  return toResponse(data);
}

export async function createCompany(
  supabase: SupabaseClient,
  userId: string,
  input: CreateCompanyInput,
): Promise<CompanyResponse> {
  const { data, error } = await supabase
    .from('companies')
    .insert({ ...toColumns(input), user_id: userId })
    .select(COLUMNS)
    .single<CompanyRow>();
  if (error?.code === UNIQUE_VIOLATION) throw duplicateName();
  if (error) throw new Error(`Failed to create company: ${error.message}`);
  return toResponse(data);
}

export async function updateCompany(
  supabase: SupabaseClient,
  id: string,
  input: UpdateCompanyInput,
): Promise<CompanyResponse> {
  const { data, error } = await supabase
    .from('companies')
    .update(toColumns(input))
    .eq('id', id)
    .select(COLUMNS)
    .single<CompanyRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Company not found');
  if (error?.code === UNIQUE_VIOLATION) throw duplicateName();
  if (error) throw new Error(`Failed to update company: ${error.message}`);
  return toResponse(data);
}

export async function deleteCompany(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from('companies').delete().eq('id', id).select('id');
  // ON DELETE RESTRICT: the database refuses to delete a company that still has applications.
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    throw new HttpError(409, 'This company still has applications. Delete or reassign them first.');
  }
  if (error) throw new Error(`Failed to delete company: ${error.message}`);
  if (data.length === 0) throw new HttpError(404, 'Company not found');
}
