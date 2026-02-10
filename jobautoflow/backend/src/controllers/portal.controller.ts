/**
 * Portal Controller
 * Handles job portal connections and management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/**
 * Get all job portals
 * GET /api/v1/portals
 */
export const getPortals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const portals = await prisma.jobPortal.findMany({
    where: { isActive: true },
    orderBy: { displayName: 'asc' },
    select: {
      id: true,
      name: true,
      displayName: true,
      description: true,
      logoUrl: true,
      isActive: true,
      requiresAuth: true,
      authType: true,
    },
  });

  // If user is authenticated, include connection status
  if (req.user) {
    const connections = await prisma.userPortalConnection.findMany({
      where: { userId: req.user.id },
    });

    const connectionMap = new Map(connections.map((c) => [c.portalId, c]));

    const portalsWithStatus = portals.map((portal) => ({
      ...portal,
      isConnected: connectionMap.has(portal.id),
      lastSyncAt: connectionMap.get(portal.id)?.lastSyncAt || null,
      syncStatus: connectionMap.get(portal.id)?.syncStatus || null,
    }));

    return res.json({
      success: true,
      data: { portals: portalsWithStatus },
    });
  }

  res.json({
    success: true,
    data: { portals },
  });
});

/**
 * Connect to a job portal
 * POST /api/v1/portals/:id/connect
 */
export const connectPortal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { accessToken, refreshToken, expiresAt, scope } = req.body;

  // Check if portal exists
  const portal = await prisma.jobPortal.findUnique({
    where: { id },
  });

  if (!portal) {
    throw new ApiError(404, 'Portal not found', true, 'NOT_FOUND');
  }

  if (!portal.isActive) {
    throw new ApiError(400, 'This portal is currently unavailable', true, 'PORTAL_INACTIVE');
  }

  // Check if already connected
  const existingConnection = await prisma.userPortalConnection.findUnique({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
  });

  if (existingConnection?.isActive) {
    throw new ApiError(409, 'Already connected to this portal', true, 'ALREADY_CONNECTED');
  }

  // Create or update connection
  const connection = await prisma.userPortalConnection.upsert({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
    update: {
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
      scope,
      isActive: true,
      syncStatus: 'pending',
      errorMessage: null,
    },
    create: {
      userId: req.user.id,
      portalId: id,
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
      scope,
      isActive: true,
      syncStatus: 'pending',
    },
  });

  logger.info({
    message: 'Portal connected',
    userId: req.user.id,
    portalId: id,
    portalName: portal.name,
  });

  res.json({
    success: true,
    message: `Connected to ${portal.displayName} successfully`,
    data: { connection },
  });
});

/**
 * Disconnect from a job portal
 * DELETE /api/v1/portals/:id/disconnect
 */
export const disconnectPortal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Check if connection exists
  const connection = await prisma.userPortalConnection.findUnique({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
    include: {
      portal: true,
    },
  });

  if (!connection) {
    throw new ApiError(404, 'Connection not found', true, 'NOT_FOUND');
  }

  // Delete connection
  await prisma.userPortalConnection.delete({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
  });

  logger.info({
    message: 'Portal disconnected',
    userId: req.user.id,
    portalId: id,
    portalName: connection.portal.name,
  });

  res.json({
    success: true,
    message: `Disconnected from ${connection.portal.displayName} successfully`,
  });
});

/**
 * Get portal connection status
 * GET /api/v1/portals/:id/status
 */
export const getPortalStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const connection = await prisma.userPortalConnection.findUnique({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
    include: {
      portal: {
        select: {
          name: true,
          displayName: true,
        },
      },
    },
  });

  if (!connection) {
    return res.json({
      success: true,
      data: {
        isConnected: false,
        status: 'not_connected',
      },
    });
  }

  res.json({
    success: true,
    data: {
      isConnected: connection.isActive,
      status: connection.syncStatus,
      lastSyncAt: connection.lastSyncAt,
      errorMessage: connection.errorMessage,
      portal: connection.portal,
    },
  });
});

/**
 * Sync portal data
 * POST /api/v1/portals/:id/sync
 */
export const syncPortal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const connection = await prisma.userPortalConnection.findUnique({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
    include: {
      portal: true,
    },
  });

  if (!connection) {
    throw new ApiError(404, 'Connection not found', true, 'NOT_FOUND');
  }

  if (!connection.isActive) {
    throw new ApiError(400, 'Connection is not active', true, 'CONNECTION_INACTIVE');
  }

  // Update sync status
  await prisma.userPortalConnection.update({
    where: {
      userId_portalId: {
        userId: req.user.id,
        portalId: id,
      },
    },
    data: {
      syncStatus: 'syncing',
    },
  });

  // In production, this would trigger a background job to sync data
  // For now, we'll just simulate a successful sync

  setTimeout(async () => {
    await prisma.userPortalConnection.update({
      where: {
        userId_portalId: {
          userId: req.user.id,
          portalId: id,
        },
      },
      data: {
        syncStatus: 'synced',
        lastSyncAt: new Date(),
      },
    });
  }, 1000);

  res.json({
    success: true,
    message: 'Sync initiated',
    data: {
      status: 'syncing',
    },
  });
});
