/**
 * Preference Routes
 */

import { Router } from 'express';
import {
  getPreferences,
  updatePreferences,
  toggleAutoApply,
} from '../controllers/preference.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getPreferences);
router.put('/', updatePreferences);
router.post('/auto-apply/toggle', toggleAutoApply);

export default router;
