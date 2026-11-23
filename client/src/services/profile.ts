import { apiRequest } from './api.ts';
import type { Profile, UpdateProfileInput } from '../types/api.ts';

export const fetchProfile = () => apiRequest<Profile>('/profile');

export const updateProfile = (input: UpdateProfileInput) =>
  apiRequest<Profile>('/profile', { method: 'PATCH', body: JSON.stringify(input) });
