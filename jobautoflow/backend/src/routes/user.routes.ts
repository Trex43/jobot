/**
 * User Routes
 */

import { Router } from 'express';
import {
  getMe,
  updateMe,
  deleteMe,
  getUserStats,
  uploadAvatar,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);
router.delete('/me', deleteMe);
router.get('/me/stats', getUserStats);
router.post('/me/avatar', uploadAvatar);

export default router;
