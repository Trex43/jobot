/**
 * Notification Controller
 * Handles user notifications
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { paginationSchema } from '../utils/validation';

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const params = paginationSchema.parse(req.query);
  const unreadOnly = req.query.unread === 'true';

  const where: any = {
    userId: req.user.id,
  };

  if (unreadOnly) {
    where.isRead = false;
  }

  const skip = (params.page - 1) * params.limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / params.limit);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
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
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found', true, 'NOT_FOUND');
  }

  await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * Delete notification
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found', true, 'NOT_FOUND');
  }

  await prisma.notification.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Notification deleted',
  });
});

/**
 * Get notification preferences
 * GET /api/v1/notifications/preferences
 */
export const getNotificationPreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: req.user.id },
    select: {
      notificationEmail: true,
      notificationSms: true,
      notificationPush: true,
      notificationFrequency: true,
    },
  });

  res.json({
    success: true,
    data: { preferences },
  });
});

/**
 * Update notification preferences
 * PUT /api/v1/notifications/preferences
 */
export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { notificationEmail, notificationSms, notificationPush, notificationFrequency } = req.body;

  const preferences = await prisma.userPreferences.update({
    where: { userId: req.user.id },
    data: {
      notificationEmail,
      notificationSms,
      notificationPush,
      notificationFrequency,
    },
  });

  res.json({
    success: true,
    message: 'Notification preferences updated',
    data: { preferences },
  });
});
