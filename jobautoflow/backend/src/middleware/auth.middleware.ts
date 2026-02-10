/**
 * Authentication Middleware
 * JWT token validation and user authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { ApiError } from './error.middleware';

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Verify JWT access token and attach user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required', true, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new ApiError(401, 'Access token required', true, 'UNAUTHORIZED');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found', true, 'UNAUTHORIZED');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Account is not active', true, 'ACCOUNT_INACTIVE');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token', true, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired', true, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required', true, 'UNAUTHORIZED'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'Insufficient permissions', true, 'FORBIDDEN'));
      return;
    }

    next();
  };
};

/**
 * Require email verification
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new ApiError(401, 'Authentication required', true, 'UNAUTHORIZED'));
    return;
  }

  if (!req.user.emailVerified) {
    next(new ApiError(403, 'Email verification required', true, 'EMAIL_NOT_VERIFIED'));
    return;
  }

  next();
};
