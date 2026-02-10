/**
 * Preference Controller
 * Handles user preferences for job matching and auto-apply
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { updatePreferencesSchema } from '../utils/validation';
import { logger } from '../utils/logger';

/**
 * Get user preferences
 * GET /api/v1/preferences
 */
export const getPreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: req.user.id },
  });

  if (!preferences) {
    // Create default preferences
    const defaultPreferences = await prisma.userPreferences.create({
      data: {
        userId: req.user.id,
        jobTypes: [],
        locations: [],
        companySizes: [],
        industries: [],
        skillsToHighlight: [],
        companiesToAvoid: [],
        companiesPreferred: [],
      },
    });

    return res.json({
      success: true,
      data: { preferences: defaultPreferences },
    });
  }

  res.json({
    success: true,
    data: { preferences },
  });
});

/**
 * Update user preferences
 * PUT /api/v1/preferences
 */
export const updatePreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = updatePreferencesSchema.parse(req.body);

  // Check if preferences exist
  const existingPreferences = await prisma.userPreferences.findUnique({
    where: { userId: req.user.id },
  });

  let preferences;

  if (existingPreferences) {
    // Update existing preferences
    preferences = await prisma.userPreferences.update({
      where: { userId: req.user.id },
      data: validatedData,
    });
  } else {
    // Create new preferences
    preferences = await prisma.userPreferences.create({
      data: {
        userId: req.user.id,
        jobTypes: validatedData.jobTypes || [],
        locations: validatedData.locations || [],
        remotePreference: validatedData.remotePreference,
        salaryMin: validatedData.salaryMin,
        salaryMax: validatedData.salaryMax,
        salaryCurrency: validatedData.salaryCurrency,
        companySizes: validatedData.companySizes || [],
        industries: validatedData.industries || [],
        experienceLevels: validatedData.experienceLevels || [],
        skillsToHighlight: validatedData.skillsToHighlight || [],
        companiesToAvoid: validatedData.companiesToAvoid || [],
        companiesPreferred: validatedData.companiesPreferred || [],
        autoApplyEnabled: validatedData.autoApplyEnabled,
        autoApplyThreshold: validatedData.autoApplyThreshold,
        autoApplyMaxPerDay: validatedData.autoApplyMaxPerDay,
        notificationEmail: validatedData.notificationEmail,
        notificationSms: validatedData.notificationSms,
        notificationPush: validatedData.notificationPush,
        notificationFrequency: validatedData.notificationFrequency,
        timezone: validatedData.timezone,
      },
    });
  }

  // Trigger job matching recalculation if preferences changed
  logger.info({ message: 'Preferences updated, triggering match recalculation', userId: req.user.id });

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences },
  });
});

/**
 * Toggle auto-apply
 * POST /api/v1/preferences/auto-apply/toggle
 */
export const toggleAutoApply = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: req.user.id },
  });

  if (!preferences) {
    throw new ApiError(404, 'Preferences not found', true, 'NOT_FOUND');
  }

  const updated = await prisma.userPreferences.update({
    where: { userId: req.user.id },
    data: {
      autoApplyEnabled: !preferences.autoApplyEnabled,
    },
  });

  res.json({
    success: true,
    message: updated.autoApplyEnabled ? 'Auto-apply enabled' : 'Auto-apply disabled',
    data: { autoApplyEnabled: updated.autoApplyEnabled },
  });
});
