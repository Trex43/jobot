/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and password reset
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, redis } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../utils/validation';
import { sendEmail } from '../services/email.service';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

/**
 * Generate access token
 */
const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION,
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
  });
};

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Validate input
  const validatedData = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists', true, 'DUPLICATE_ERROR');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  // Create empty profile and preferences
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      skills: [],
      preferredRoles: [],
      industries: [],
    },
  });

  await prisma.userPreferences.create({
    data: {
      userId: user.id,
      jobTypes: [],
      locations: [],
      companySizes: [],
      industries: [],
      skillsToHighlight: [],
      companiesToAvoid: [],
      companiesPreferred: [],
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token to database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  // Send welcome email
  await sendEmail({
    to: user.email,
    subject: 'Welcome to JobAutoFlow!',
    template: 'welcome',
    data: {
      firstName: user.firstName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    },
  });

  logger.info({ message: 'User registered', userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_ACCESS_EXPIRATION,
      },
    },
  });
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Validate input
  const validatedData = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password', true, 'INVALID_CREDENTIALS');
  }

  // Check if account is active
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Account is not active', true, 'ACCOUNT_INACTIVE');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password', true, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token to database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  logger.info({ message: 'User logged in', userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_ACCESS_EXPIRATION,
      },
    },
  });
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Validate input
  const validatedData = refreshTokenSchema.parse(req.body);

  // Find refresh token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: validatedData.refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new ApiError(401, 'Invalid refresh token', true, 'INVALID_TOKEN');
  }

  // Check if token is expired or revoked
  if (storedToken.expiresAt < new Date() || storedToken.revokedAt) {
    throw new ApiError(401, 'Refresh token expired', true, 'TOKEN_EXPIRED');
  }

  // Verify token
  try {
    jwt.verify(validatedData.refreshToken, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token', true, 'INVALID_TOKEN');
  }

  // Generate new tokens
  const accessToken = generateAccessToken(storedToken.user.id, storedToken.user.email, storedToken.user.role);
  const newRefreshToken = generateRefreshToken(storedToken.user.id);

  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Save new refresh token
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.user.id,
      token: newRefreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_ACCESS_EXPIRATION,
      },
    },
  });
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Forgot password
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    });
    return;
  }

  // Generate reset token
  const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  // Save reset token
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt,
    },
  });

  // Send reset email
  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    template: 'password-reset',
    data: {
      firstName: user.firstName,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      expiresIn: '1 hour',
    },
  });

  res.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent',
  });
});

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = resetPasswordSchema.parse(req.body);

  // Find reset token
  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      token: validatedData.token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new ApiError(400, 'Invalid or expired reset token', true, 'INVALID_TOKEN');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_ROUNDS);

  // Update user password
  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash },
  });

  // Mark token as used
  await prisma.passwordReset.update({
    where: { id: resetRecord.id },
    data: { usedAt: new Date() },
  });

  // Revoke all refresh tokens for user
  await prisma.refreshToken.updateMany({
    where: { userId: resetRecord.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  // Send confirmation email
  await sendEmail({
    to: resetRecord.user.email,
    subject: 'Password Reset Successful',
    template: 'password-reset-success',
    data: {
      firstName: resetRecord.user.firstName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    },
  });

  logger.info({ message: 'Password reset', userId: resetRecord.userId });

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});

/**
 * Change password (authenticated)
 * PUT /api/v1/users/me/password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = changePasswordSchema.parse(req.body);
  const userId = req.user.id;

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', true, 'NOT_FOUND');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect', true, 'INVALID_CREDENTIALS');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(validatedData.newPassword, BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Revoke all refresh tokens except current one
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  logger.info({ message: 'Password changed', userId });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
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
