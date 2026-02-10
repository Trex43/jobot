/**
 * Application Routes
 */

import { Router } from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats,
  autoApply,
} from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getApplications);
router.get('/stats', getApplicationStats);
router.post('/auto-apply', autoApply);
router.post('/', createApplication);
router.get('/:id', getApplicationById);
router.put('/:id', updateApplication);
router.delete('/:id', deleteApplication);

export default router;
