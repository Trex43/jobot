/**
 * Job Routes
 */

import { Router } from 'express';
import {
  searchJobs,
  getJobById,
  getMatchedJobs,
  toggleFavorite,
  hideJob,
  getJobStats,
} from '../controllers/job.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes with optional auth
router.get('/', optionalAuth, searchJobs);
router.get('/:id', optionalAuth, getJobById);

// Protected routes
router.use(authenticate);
router.get('/matches/list', getMatchedJobs);
router.post('/:id/favorite', toggleFavorite);
router.post('/:id/hide', hideJob);

// Admin routes
router.get('/admin/stats', requireRole('ADMIN', 'SUPERADMIN'), getJobStats);

export default router;
