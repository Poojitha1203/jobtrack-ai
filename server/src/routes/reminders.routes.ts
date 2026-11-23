import { Router } from 'express';
import { createReminder, deleteReminder, listReminders, updateReminder } from '../controllers/reminders.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createReminderSchema, updateReminderSchema } from '../validators/reminder.schema.js';

const router = Router();

router.get('/', listReminders);
router.post('/', validateBody(createReminderSchema), createReminder);
router.patch('/:id', validateBody(updateReminderSchema), updateReminder);
router.delete('/:id', deleteReminder);

export default router;
