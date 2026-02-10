/**
 * User Controller
 * Handles user profile management and stats
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { updateUserSchema } from '../utils/validation';
import { logger } from '../utils/logger';

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      profile: true,
      preferences: true,
      subscriptions: {
        where: {
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', true, 'NOT_FOUND');
  }

  // Get unread notification count
  const unreadNotifications = await prisma.notification.count({
    where: {
      userId: req.user.id,
      isRead: false,
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      profile: user.profile,
      preferences: user.preferences,
      subscription: user.subscriptions[0] || null,
      stats: {
        unreadNotifications,
      },
    },
  });
});

/**
 * Update current user
 * PUT /api/v1/users/me
 */
export const updateMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = updateUserSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: validatedData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      updatedAt: true,
    },
  });

  logger.info({ message: 'User updated', userId: req.user.id });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

/**
 * Delete current user account
 * DELETE /api/v1/users/me
 */
export const deleteMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, 'Password is required to delete account', true, 'VALIDATION_ERROR');
  }

  // Verify password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', true, 'NOT_FOUND');
  }

  const bcrypt = await import('bcryptjs');
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password', true, 'INVALID_CREDENTIALS');
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: req.user.id },
  });

  logger.info({ message: 'User deleted', userId: req.user.id });

  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
});

/**
 * Get user stats
 * GET /api/v1/users/me/stats
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;

  // Get application stats
  const applicationStats = await prisma.application.groupBy({
    by: ['status'],
    where: { userId },
    _count: {
      status: true,
    },
  });

  const totalApplications = await prisma.application.count({
    where: { userId },
  });

  const thisWeekApplications = await prisma.application.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const thisMonthApplications = await prisma.application.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Get matched jobs count
  const matchedJobs = await prisma.jobMatchCache.count({
    where: {
      userId,
      isHidden: false,
    },
  });

  // Get interviews scheduled
  const interviewsScheduled = await prisma.application.count({
    where: {
      userId,
      status: { in: ['INTERVIEW', 'OFFER'] },
    },
  });

  const interviewsCompleted = await prisma.application.count({
    where: {
      userId,
      status: 'OFFER',
    },
  });

  // Calculate response rate
  const viewedApplications = await prisma.application.count({
    where: {
      userId,
      status: { in: ['VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED'] },
    },
  });

  const responseRate = totalApplications > 0
    ? Math.round((viewedApplications / totalApplications) * 100)
    : 0;

  // Get applications by status
  const statusCounts: Record<string, number> = {};
  applicationStats.forEach((stat) => {
    statusCounts[stat.status] = stat._count.status;
  });

  res.json({
    success: true,
    data: {
      applications: {
        total: totalApplications,
        thisWeek: thisWeekApplications,
        thisMonth: thisMonthApplications,
        byStatus: statusCounts,
      },
      jobs: {
        matched: matchedJobs,
      },
      interviews: {
        scheduled: interviewsScheduled,
        completed: interviewsCompleted,
      },
      responseRate,
    },
  });
});

/**
 * Upload avatar
 * POST /api/v1/users/me/avatar
 */
export const uploadAvatar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // In production, this would handle file upload to S3
  // For now, we'll just accept a URL
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    throw new ApiError(400, 'Avatar URL is required', true, 'VALIDATION_ERROR');
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
    select: {
      id: true,
      avatarUrl: true,
    },
  });

  res.json({
    success: true,
    message: 'Avatar updated successfully',
    data: { avatarUrl: user.avatarUrl },
  });
});
