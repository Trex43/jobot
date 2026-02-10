/**
 * Subscription Routes
 */

import { Router } from 'express';
import {
  getPlans,
  getSubscription,
  createSubscription,
  cancelSubscription,
  getInvoices,
  handleWebhook,
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/plans', getPlans);

// Stripe webhook (raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(authenticate);
router.get('/', getSubscription);
router.post('/', createSubscription);
router.delete('/', cancelSubscription);
router.get('/invoices', getInvoices);

// Need to import express for webhook
import express from 'express';

export default router;
