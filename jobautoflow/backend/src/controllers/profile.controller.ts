/**
 * Profile Controller
 * Handles user profile management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { updateProfileSchema } from '../utils/validation';
import { logger } from '../utils/logger';

/**
 * Get user profile
 * GET /api/v1/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found', true, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: { profile },
  });
});

/**
 * Update user profile
 * PUT /api/v1/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = updateProfileSchema.parse(req.body);

  // Check if profile exists
  const existingProfile = await prisma.userProfile.findUnique({
    where: { userId: req.user.id },
  });

  let profile;

  if (existingProfile) {
    // Update existing profile
    profile = await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: validatedData,
    });
  } else {
    // Create new profile
    profile = await prisma.userProfile.create({
      data: {
        userId: req.user.id,
        ...validatedData,
        skills: validatedData.skills || [],
        preferredRoles: validatedData.preferredRoles || [],
        industries: validatedData.industries || [],
      },
    });
  }

  // Trigger job matching recalculation
  // This would be done asynchronously in a background job
  logger.info({ message: 'Profile updated, triggering match recalculation', userId: req.user.id });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile },
  });
});

/**
 * Upload resume
 * POST /api/v1/profile/resume
 */
export const uploadResume = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { resumeUrl, resumeFilename } = req.body;

  if (!resumeUrl) {
    throw new ApiError(400, 'Resume URL is required', true, 'VALIDATION_ERROR');
  }

  const profile = await prisma.userProfile.update({
    where: { userId: req.user.id },
    data: {
      resumeUrl,
      resumeFilename: resumeFilename || 'resume.pdf',
    },
  });

  logger.info({ message: 'Resume uploaded', userId: req.user.id });

  res.json({
    success: true,
    message: 'Resume uploaded successfully',
    data: {
      resumeUrl: profile.resumeUrl,
      resumeFilename: profile.resumeFilename,
    },
  });
});

/**
 * Delete resume
 * DELETE /api/v1/profile/resume
 */
export const deleteResume = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await prisma.userProfile.update({
    where: { userId: req.user.id },
    data: {
      resumeUrl: null,
      resumeFilename: null,
    },
  });

  logger.info({ message: 'Resume deleted', userId: req.user.id });

  res.json({
    success: true,
    message: 'Resume deleted successfully',
  });
});

/**
 * Parse resume (AI-powered)
 * POST /api/v1/profile/parse-resume
 */
export const parseResume = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // In production, this would:
  // 1. Download the resume from S3
  // 2. Use OpenAI or a resume parsing service to extract information
  // 3. Update the profile with extracted data

  const { resumeUrl } = req.body;

  if (!resumeUrl) {
    throw new ApiError(400, 'Resume URL is required', true, 'VALIDATION_ERROR');
  }

  // Mock parsing result
  // In production, integrate with OpenAI or a resume parsing API
  const parsedData = {
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    experienceYears: 5,
    preferredRoles: ['Software Engineer', 'Full Stack Developer'],
    summary: 'Experienced software developer with 5 years of experience...',
  };

  res.json({
    success: true,
    message: 'Resume parsed successfully',
    data: parsedData,
  });
});
