import { Router } from 'express';
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from '../controllers/companies.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createCompanySchema, updateCompanySchema } from '../validators/company.schema.js';

const router = Router();

router.get('/', listCompanies);
router.post('/', validateBody(createCompanySchema), createCompany);
router.get('/:id', getCompany);
router.patch('/:id', validateBody(updateCompanySchema), updateCompany);
router.delete('/:id', deleteCompany);

export default router;
