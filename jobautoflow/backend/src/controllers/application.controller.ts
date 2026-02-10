/**
 * Application Controller
 * Handles job applications and tracking
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { createApplicationSchema, updateApplicationSchema } from '../utils/validation';
import { logger } from '../utils/logger';
import { calculateMatchScore } from '../services/matching.service';

/**
 * Get user's applications
 * GET /api/v1/applications
 */
export const getApplications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const skip = (page - 1) * limit;

  const where: any = {
    userId: req.user.id,
  };

  if (status) {
    where.status = status;
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            companyLogoUrl: true,
            location: true,
            locationType: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            jobType: true,
            postedAt: true,
          },
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      applications,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Get application by ID
 * GET /api/v1/applications/:id
 */
export const getApplicationById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const application = await prisma.application.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
    include: {
      job: true,
    },
  });

  if (!application) {
    throw new ApiError(404, 'Application not found', true, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: { application },
  });
});

/**
 * Create new application
 * POST /api/v1/applications
 */
export const createApplication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = createApplicationSchema.parse(req.body);

  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id: validatedData.jobId },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found', true, 'NOT_FOUND');
  }

  // Check if already applied
  const existingApplication = await prisma.application.findUnique({
    where: {
      userId_jobId: {
        userId: req.user.id,
        jobId: validatedData.jobId,
      },
    },
  });

  if (existingApplication) {
    throw new ApiError(409, 'You have already applied to this job', true, 'DUPLICATE_ERROR');
  }

  // Calculate match score
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: req.user.id },
  });

  let matchScore = null;
  let matchReasons: string[] = [];

  if (userProfile) {
    const matchResult = await calculateMatchScore(userProfile, job);
    matchScore = matchResult.score;
    matchReasons = matchResult.reasons;
  }

  // Create application
  const application = await prisma.application.create({
    data: {
      userId: req.user.id,
      jobId: validatedData.jobId,
      status: 'PENDING',
      matchScore,
      matchReasons,
      coverLetter: validatedData.coverLetter,
      resumeVersion: validatedData.resumeVersion,
      notes: validatedData.notes,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          companyLogoUrl: true,
          location: true,
        },
      },
    },
  });

  // Increment job application count
  await prisma.job.update({
    where: { id: validatedData.jobId },
    data: { applicationCount: { increment: 1 } },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: req.user.id,
      type: 'APPLICATION',
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${job.company} has been submitted.`,
      data: { applicationId: application.id, jobId: job.id },
    },
  });

  logger.info({
    message: 'Application created',
    userId: req.user.id,
    jobId: validatedData.jobId,
    applicationId: application.id,
  });

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application },
  });
});

/**
 * Update application
 * PUT /api/v1/applications/:id
 */
export const updateApplication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const validatedData = updateApplicationSchema.parse(req.body);

  // Check if application exists and belongs to user
  const existingApplication = await prisma.application.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingApplication) {
    throw new ApiError(404, 'Application not found', true, 'NOT_FOUND');
  }

  const application = await prisma.application.update({
    where: { id },
    data: validatedData,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'Application updated successfully',
    data: { application },
  });
});

/**
 * Delete/withdraw application
 * DELETE /api/v1/applications/:id
 */
export const deleteApplication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Check if application exists and belongs to user
  const existingApplication = await prisma.application.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingApplication) {
    throw new ApiError(404, 'Application not found', true, 'NOT_FOUND');
  }

  await prisma.application.update({
    where: { id },
    data: { status: 'WITHDRAWN' },
  });

  logger.info({
    message: 'Application withdrawn',
    userId: req.user.id,
    applicationId: id,
  });

  res.json({
    success: true,
    message: 'Application withdrawn successfully',
  });
});

/**
 * Get application stats
 * GET /api/v1/applications/stats
 */
export const getApplicationStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;

  const stats = await prisma.application.groupBy({
    by: ['status'],
    where: { userId },
    _count: {
      status: true,
    },
  });

  const statusCounts: Record<string, number> = {
    PENDING: 0,
    APPLIED: 0,
    VIEWED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };

  stats.forEach((stat) => {
    statusCounts[stat.status] = stat._count.status;
  });

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // Get weekly stats
  const weeklyStats = await prisma.application.groupBy({
    by: ['status'],
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    _count: {
      status: true,
    },
  });

  const weeklyCounts: Record<string, number> = {};
  weeklyStats.forEach((stat) => {
    weeklyCounts[stat.status] = stat._count.status;
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: statusCounts,
      thisWeek: weeklyCounts,
    },
  });
});

/**
 * Auto-apply to matched jobs
 * POST /api/v1/applications/auto-apply
 */
export const autoApply = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get user preferences
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: req.user.id },
  });

  if (!preferences || !preferences.autoApplyEnabled) {
    throw new ApiError(400, 'Auto-apply is not enabled', true, 'AUTO_APPLY_DISABLED');
  }

  // Get user's daily application count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyCount = await prisma.application.count({
    where: {
      userId: req.user.id,
      isAutoApplied: true,
      createdAt: {
        gte: today,
      },
    },
  });

  if (dailyCount >= preferences.autoApplyMaxPerDay) {
    throw new ApiError(429, 'Daily auto-apply limit reached', true, 'RATE_LIMIT');
  }

  // Get matched jobs above threshold that haven't been applied to
  const matchedJobs = await prisma.jobMatchCache.findMany({
    where: {
      userId: req.user.id,
      matchScore: { gte: preferences.autoApplyThreshold },
      isHidden: false,
    },
    orderBy: { matchScore: 'desc' },
    take: preferences.autoApplyMaxPerDay - dailyCount,
    include: {
      job: true,
    },
  });

  // Filter out jobs that have already been applied to
  const jobIds = matchedJobs.map((m) => m.jobId);
  
  const existingApplications = await prisma.application.findMany({
    where: {
      userId: req.user.id,
      jobId: { in: jobIds },
    },
    select: { jobId: true },
  });

  const appliedJobIds = new Set(existingApplications.map((a) => a.jobId));
  
  const jobsToApply = matchedJobs.filter((m) => !appliedJobIds.has(m.jobId));

  // Create applications
  const applications = [];
  for (const match of jobsToApply) {
    const application = await prisma.application.create({
      data: {
        userId: req.user.id,
        jobId: match.jobId,
        status: 'PENDING',
        matchScore: match.matchScore,
        matchReasons: match.matchDetails ? Object.keys(match.matchDetails as object) : [],
        isAutoApplied: true,
      },
    });

    applications.push(application);

    // Increment job application count
    await prisma.job.update({
      where: { id: match.jobId },
      data: { applicationCount: { increment: 1 } },
    });
  }

  logger.info({
    message: 'Auto-apply completed',
    userId: req.user.id,
    applicationsCreated: applications.length,
  });

  res.json({
    success: true,
    message: `Auto-applied to ${applications.length} jobs`,
    data: {
      applicationsCreated: applications.length,
      jobs: jobsToApply.map((m) => ({
        id: m.jobId,
        title: m.job.title,
        company: m.job.company,
        matchScore: m.matchScore,
      })),
    },
  });
});
