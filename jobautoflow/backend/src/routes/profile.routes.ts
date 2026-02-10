/**
 * Profile Routes
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadResume,
  deleteResume,
  parseResume,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/resume', uploadResume);
router.delete('/resume', deleteResume);
router.post('/parse-resume', parseResume);

export default router;
