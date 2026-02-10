/**
 * Admin Controller
 * Handles admin dashboard and management functions
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { updateUserAdminSchema, createPlanSchema, paginationSchema } from '../utils/validation';
import { logger } from '../utils/logger';

/**
 * Get admin dashboard stats
 * GET /api/v1/admin/stats
 */
export const getStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // User stats
  const [totalUsers, activeUsers, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
  ]);

  // Application stats
  const [totalApplications, applicationsThisWeek, applicationsThisMonth] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { createdAt: { gte: monthAgo } } }),
  ]);

  // Job stats
  const [totalJobs, activeJobs, newJobsThisWeek] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: 'ACTIVE' } }),
    prisma.job.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  // Revenue stats
  const [totalRevenue, revenueThisMonth, revenueThisYear] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: monthAgo },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: yearAgo },
      },
      _sum: { amount: true },
    }),
  ]);

  // Subscription stats
  const [totalSubscriptions, activeSubscriptions, trialingSubscriptions] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'TRIALING' } }),
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      applications: {
        total: totalApplications,
        thisWeek: applicationsThisWeek,
        thisMonth: applicationsThisMonth,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        newThisWeek: newJobsThisWeek,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: revenueThisMonth._sum.amount || 0,
        thisYear: revenueThisYear._sum.amount || 0,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
      },
    },
  });
});

/**
 * Get all users (admin)
 * GET /api/v1/admin/users
 */
export const getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const params = paginationSchema.parse(req.query);
  const search = req.query.search as string;
  const role = req.query.role as string;
  const status = req.query.status as string;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const skip = (params.page - 1) * params.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [params.sortBy || 'createdAt']: params.sortOrder },
      skip,
      take: params.limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / params.limit);

  res.json({
    success: true,
    data: {
      users,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
      },
    },
  });
});

/**
 * Get user by ID (admin)
 * GET /api/v1/admin/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      preferences: true,
      subscriptions: {
        include: {
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', true, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * Update user (admin)
 * PUT /api/v1/admin/users/:id
 */
export const updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const validatedData = updateUserAdminSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id },
    data: validatedData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      emailVerified: true,
      updatedAt: true,
    },
  });

  logger.info({
    message: 'User updated by admin',
    adminId: req.user.id,
    userId: id,
    changes: validatedData,
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

/**
 * Delete user (admin)
 * DELETE /api/v1/admin/users/:id
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (id === req.user.id) {
    throw new ApiError(400, 'Cannot delete your own account', true, 'INVALID_OPERATION');
  }

  await prisma.user.delete({
    where: { id },
  });

  logger.info({
    message: 'User deleted by admin',
    adminId: req.user.id,
    userId: id,
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * Get activity logs (admin)
 * GET /api/v1/admin/logs
 */
export const getActivityLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const params = paginationSchema.parse(req.query);
  const userId = req.query.userId as string;
  const action = req.query.action as string;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  const skip = (params.page - 1) * params.limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / params.limit);

  res.json({
    success: true,
    data: {
      logs,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
      },
    },
  });
});

/**
 * Create subscription plan (admin)
 * POST /api/v1/admin/plans
 */
export const createPlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = createPlanSchema.parse(req.body);

  const plan = await prisma.subscriptionPlan.create({
    data: validatedData,
  });

  logger.info({
    message: 'Subscription plan created',
    adminId: req.user.id,
    planId: plan.id,
  });

  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    data: { plan },
  });
});

/**
 * Update subscription plan (admin)
 * PUT /api/v1/admin/plans/:id
 */
export const updatePlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const validatedData = createPlanSchema.partial().parse(req.body);

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: validatedData,
  });

  logger.info({
    message: 'Subscription plan updated',
    adminId: req.user.id,
    planId: id,
  });

  res.json({
    success: true,
    message: 'Plan updated successfully',
    data: { plan },
  });
});

/**
 * Delete subscription plan (admin)
 * DELETE /api/v1/admin/plans/:id
 */
export const deletePlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.subscriptionPlan.delete({
    where: { id },
  });

  logger.info({
    message: 'Subscription plan deleted',
    adminId: req.user.id,
    planId: id,
  });

  res.json({
    success: true,
    message: 'Plan deleted successfully',
  });
});
