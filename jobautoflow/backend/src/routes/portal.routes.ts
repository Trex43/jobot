/**
 * Portal Routes
 */

import { Router } from 'express';
import {
  getPortals,
  connectPortal,
  disconnectPortal,
  getPortalStatus,
  syncPortal,
} from '../controllers/portal.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', optionalAuth, getPortals);

// Protected routes
router.use(authenticate);
router.post('/:id/connect', connectPortal);
router.delete('/:id/disconnect', disconnectPortal);
router.get('/:id/status', getPortalStatus);
router.post('/:id/sync', syncPortal);

export default router;
