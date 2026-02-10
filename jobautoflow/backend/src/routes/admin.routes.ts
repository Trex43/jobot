/**
 * Admin Routes
 */

import { Router } from 'express';
import {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getActivityLogs,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPERADMIN'));

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Activity logs
router.get('/logs', getActivityLogs);

// Plan management
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

export default router;
