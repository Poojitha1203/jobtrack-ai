import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import { HttpError } from '../utils/HttpError.js';
import type { ProfileResponse, UserRole } from '../types/api.js';
import type { UpdateProfileInput } from '../validators/profile.schema.js';

// Database rows use snake_case; the API uses camelCase. These helpers translate.
interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  weekly_goal: number;
  role: UserRole;
  created_at: string;
}

const PROFILE_COLUMNS = 'id, email, full_name, headline, location, weekly_goal, role, created_at';

const toProfileResponse = (row: ProfileRow): ProfileResponse => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  headline: row.headline,
  location: row.location,
  weeklyGoal: row.weekly_goal,
  role: row.role,
  createdAt: row.created_at,
});

// PostgREST error code for ".single() found no row".
const NO_ROWS = 'PGRST116';

// GET /api/profile
export const getProfile = async (req: Request, res: Response<ProfileResponse>) => {
  const { userId, supabase } = getAuth(req);

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single<ProfileRow>();

  if (error?.code === NO_ROWS) throw new HttpError(404, 'Profile not found');
  if (error) throw new Error(`Failed to load profile: ${error.message}`);

  res.json(toProfileResponse(data));
};

// PATCH /api/profile (body already validated by updateProfileSchema)
export const updateProfile = async (req: Request, res: Response<ProfileResponse>) => {
  const { userId, supabase } = getAuth(req);
  const input = req.body as UpdateProfileInput;

  const updates: Partial<ProfileRow> = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.headline !== undefined) updates.headline = input.headline;
  if (input.location !== undefined) updates.location = input.location;
  if (input.weeklyGoal !== undefined) updates.weekly_goal = input.weeklyGoal;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single<ProfileRow>();

  if (error?.code === NO_ROWS) throw new HttpError(404, 'Profile not found');
  if (error) throw new Error(`Failed to update profile: ${error.message}`);

  res.json(toProfileResponse(data));
};
