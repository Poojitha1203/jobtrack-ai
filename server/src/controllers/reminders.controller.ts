import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/reminders.service.js';
import { parseId, parseQuery } from '../utils/parse.js';
import {
  listRemindersQuerySchema,
  type CreateReminderInput,
  type UpdateReminderInput,
} from '../validators/reminder.schema.js';
import type { ReminderResponse } from '../types/api.js';

export const listReminders = async (req: Request, res: Response<{ items: ReminderResponse[] }>) => {
  const { supabase } = getAuth(req);
  const query = parseQuery(listRemindersQuerySchema, req.query);
  res.json({ items: await service.listReminders(supabase, query) });
};

export const createReminder = async (req: Request, res: Response<ReminderResponse>) => {
  const { supabase, userId } = getAuth(req);
  res.status(201).json(await service.createReminder(supabase, userId, req.body as CreateReminderInput));
};

export const updateReminder = async (req: Request, res: Response<ReminderResponse>) => {
  const { supabase } = getAuth(req);
  const id = parseId(req.params.id, 'Reminder');
  res.json(await service.updateReminder(supabase, id, req.body as UpdateReminderInput));
};

export const deleteReminder = async (req: Request, res: Response) => {
  const { supabase } = getAuth(req);
  await service.deleteReminder(supabase, parseId(req.params.id, 'Reminder'));
  res.status(204).end();
};
