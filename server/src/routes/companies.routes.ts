import { Router } from 'express';
import { listCompanies } from '../controllers/companies.controller.js';

const router = Router();

router.get('/', listCompanies);

export default router;
