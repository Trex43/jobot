/**
 * Subscription Controller
 * Handles subscription plans, payments, and billing
 */

import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { createSubscriptionSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Get subscription plans
 * GET /api/v1/subscriptions/plans
 */
export const getPlans = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      priceMonthly: true,
      priceYearly: true,
      currency: true,
      features: true,
      isActive: true,
    },
  });

  res.json({
    success: true,
    data: { plans },
  });
});

/**
 * Get current user's subscription
 * GET /api/v1/subscriptions
 */
export const getSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!subscription) {
    return res.json({
      success: true,
      data: { subscription: null },
    });
  }

  res.json({
    success: true,
    data: { subscription },
  });
});

/**
 * Create subscription
 * POST /api/v1/subscriptions
 */
export const createSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = createSubscriptionSchema.parse(req.body);

  // Get plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: validatedData.planId },
  });

  if (!plan) {
    throw new ApiError(404, 'Plan not found', true, 'NOT_FOUND');
  }

  // Get or create Stripe customer
  let user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      subscriptions: {
        where: {
          stripeCustomerId: { not: null },
        },
        take: 1,
      },
    },
  });

  let stripeCustomerId = user?.subscriptions[0]?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: `${user?.firstName} ${user?.lastName}`,
    });
    stripeCustomerId = customer.id;
  }

  // Get Stripe price ID
  const priceId = validatedData.billingCycle === 'yearly'
    ? process.env.STRIPE_PRICE_PRO_YEARLY
    : process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (!priceId) {
    throw new ApiError(500, 'Payment configuration error', true, 'CONFIG_ERROR');
  }

  // Create Stripe subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  // Create subscription in database
  const subscription = await prisma.subscription.create({
    data: {
      userId: req.user.id,
      planId: plan.id,
      status: 'TRIALING',
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    include: {
      plan: true,
    },
  });

  logger.info({
    message: 'Subscription created',
    userId: req.user.id,
    subscriptionId: subscription.id,
    planId: plan.id,
  });

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    },
  });
});

/**
 * Cancel subscription
 * DELETE /api/v1/subscriptions
 */
export const cancelSubscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
  });

  if (!subscription) {
    throw new ApiError(404, 'No active subscription found', true, 'NOT_FOUND');
  }

  // Cancel in Stripe
  if (subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Update in database
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    },
  });

  logger.info({
    message: 'Subscription cancelled',
    userId: req.user.id,
    subscriptionId: subscription.id,
  });

  res.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the billing period',
  });
});

/**
 * Get payment history
 * GET /api/v1/subscriptions/invoices
 */
export const getInvoices = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const payments = await prisma.payment.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      subscription: {
        include: {
          plan: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: { payments },
  });
});

/**
 * Handle Stripe webhook
 * POST /api/v1/subscriptions/webhook
 */
export const handleWebhook = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new ApiError(400, 'Stripe signature missing', true, 'VALIDATION_ERROR');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    throw new ApiError(400, `Webhook Error: ${err.message}`, true, 'WEBHOOK_ERROR');
  }

  // Handle events
  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    default:
      logger.info({ message: `Unhandled Stripe event: ${event.type}` });
  }

  res.json({ received: true });
});

// Helper functions for webhook handlers
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    },
  });

  if (!subscription) return;

  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: 'SUCCEEDED',
      stripePaymentIntentId: invoice.payment_intent as string,
      invoiceUrl: invoice.hosted_invoice_url,
      receiptUrl: invoice.receipt_url,
    },
  });

  logger.info({
    message: 'Payment succeeded',
    subscriptionId: subscription.id,
    amount: invoice.amount_due,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    },
  });

  if (!subscription) return;

  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: 'FAILED',
      stripePaymentIntentId: invoice.payment_intent as string,
      failureMessage: (invoice as any).last_finalization_error?.message,
    },
  });

  logger.warn({
    message: 'Payment failed',
    subscriptionId: subscription.id,
    amount: invoice.amount_due,
  });
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: stripeSub.id,
    },
  });

  if (!subscription) return;

  const status = stripeSub.status.toUpperCase() as any;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });

  logger.info({
    message: 'Subscription updated',
    subscriptionId: subscription.id,
    status,
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: stripeSub.id,
    },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELED',
      endedAt: new Date(),
    },
  });

  logger.info({
    message: 'Subscription deleted',
    subscriptionId: subscription.id,
  });
}
