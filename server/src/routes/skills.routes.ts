import { Router } from 'express';
import { getGap, listCatalog, listMine, removeMine, upsertMine } from '../controllers/skills.controller.js';
import { validateBody } from '../middleware/validate.js';
import { upsertUserSkillSchema } from '../validators/userSkill.schema.js';

const router = Router();

router.get('/', listCatalog);
router.get('/gap', getGap);
router.get('/mine', listMine);
router.put('/mine/:skillId', validateBody(upsertUserSkillSchema), upsertMine);
router.delete('/mine/:skillId', removeMine);

export default router;
