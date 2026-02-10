/**
 * Job Controller
 * Handles job search, matching, and management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { ApiError, asyncHandler } from '../middleware/error.middleware';
import { jobSearchSchema } from '../utils/validation';
import { logger } from '../utils/logger';

/**
 * Search jobs
 * GET /api/v1/jobs
 */
export const searchJobs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const filters = jobSearchSchema.parse(req.query);

  const where: any = {
    status: 'ACTIVE',
  };

  // Text search
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { company: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  // Location filter
  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  // Remote filter
  if (filters.remote) {
    where.locationType = { in: ['REMOTE', 'HYBRID'] };
  }

  // Job type filter
  if (filters.jobType && filters.jobType.length > 0) {
    where.jobType = { in: filters.jobType };
  }

  // Experience level filter
  if (filters.experienceLevel && filters.experienceLevel.length > 0) {
    where.experienceLevel = { in: filters.experienceLevel };
  }

  // Salary filter
  if (filters.salaryMin !== undefined || filters.salaryMax !== undefined) {
    where.AND = [];
    if (filters.salaryMin !== undefined) {
      where.AND.push({ salaryMax: { gte: filters.salaryMin } });
    }
    if (filters.salaryMax !== undefined) {
      where.AND.push({ salaryMin: { lte: filters.salaryMax } });
    }
  }

  // Skills filter
  if (filters.skills && filters.skills.length > 0) {
    where.skillsRequired = { hasSome: filters.skills };
  }

  // Posted within filter
  if (filters.postedWithin && filters.postedWithin !== 'all') {
    const now = new Date();
    let days = 30;
    if (filters.postedWithin === '24h') days = 1;
    if (filters.postedWithin === '7d') days = 7;
    
    where.postedAt = {
      gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
    };
  }

  // Calculate pagination
  const skip = (filters.page - 1) * filters.limit;

  // Build order by
  let orderBy: any = {};
  if (filters.sortBy === 'date') {
    orderBy = { postedAt: filters.sortOrder };
  } else if (filters.sortBy === 'salary') {
    orderBy = { salaryMax: filters.sortOrder };
  } else {
    orderBy = { postedAt: 'desc' };
  }

  // Execute query
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip,
      take: filters.limit,
      select: {
        id: true,
        title: true,
        company: true,
        companyLogoUrl: true,
        location: true,
        locationType: true,
        description: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        jobType: true,
        experienceLevel: true,
        skillsRequired: true,
        postedAt: true,
      },
    }),
    prisma.job.count({ where }),
  ]);

  // Get user's match scores if authenticated
  let jobsWithMatch = jobs;
  if (req.user) {
    const matchCache = await prisma.jobMatchCache.findMany({
      where: {
        userId: req.user.id,
        jobId: { in: jobs.map((j) => j.id) },
      },
    });

    const matchMap = new Map(matchCache.map((m) => [m.jobId, m]));

    jobsWithMatch = jobs.map((job) => ({
      ...job,
      matchScore: matchMap.get(job.id)?.matchScore || null,
      isFavorite: matchMap.get(job.id)?.isFavorite || false,
      isHidden: matchMap.get(job.id)?.isHidden || false,
    }));
  }

  const totalPages = Math.ceil(total / filters.limit);

  res.json({
    success: true,
    data: {
      jobs: jobsWithMatch,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    },
  });
});

/**
 * Get job by ID
 * GET /api/v1/jobs/:id
 */
export const getJobById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      portal: {
        select: {
          name: true,
          displayName: true,
        },
      },
    },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found', true, 'NOT_FOUND');
  }

  // Increment view count
  await prisma.job.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  // Get match score if user is authenticated
  let matchScore = null;
  let isFavorite = false;
  let isHidden = false;

  if (req.user) {
    const matchCache = await prisma.jobMatchCache.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.id,
          jobId: id,
        },
      },
    });

    if (matchCache) {
      matchScore = matchCache.matchScore;
      isFavorite = matchCache.isFavorite;
      isHidden = matchCache.isHidden;
    }
  }

  res.json({
    success: true,
    data: {
      job: {
        ...job,
        matchScore,
        isFavorite,
        isHidden,
      },
    },
  });
});

/**
 * Get matched jobs for current user
 * GET /api/v1/jobs/matches
 */
export const getMatchedJobs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', true, 'UNAUTHORIZED');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const minScore = parseInt(req.query.minScore as string) || 50;
  const skip = (page - 1) * limit;

  // Get matched jobs from cache
  const [matches, total] = await Promise.all([
    prisma.jobMatchCache.findMany({
      where: {
        userId: req.user.id,
        matchScore: { gte: minScore },
        isHidden: false,
      },
      orderBy: { matchScore: 'desc' },
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
            description: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            jobType: true,
            experienceLevel: true,
            skillsRequired: true,
            postedAt: true,
          },
        },
      },
    }),
    prisma.jobMatchCache.count({
      where: {
        userId: req.user.id,
        matchScore: { gte: minScore },
        isHidden: false,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      jobs: matches.map((match) => ({
        ...match.job,
        matchScore: match.matchScore,
        matchDetails: match.matchDetails,
        isFavorite: match.isFavorite,
        isHidden: match.isHidden,
      })),
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
 * Toggle favorite job
 * POST /api/v1/jobs/:id/favorite
 */
export const toggleFavorite = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', true, 'UNAUTHORIZED');
  }

  const { id } = req.params;

  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found', true, 'NOT_FOUND');
  }

  // Get or create match cache
  const existingCache = await prisma.jobMatchCache.findUnique({
    where: {
      userId_jobId: {
        userId: req.user.id,
        jobId: id,
      },
    },
  });

  let isFavorite;

  if (existingCache) {
    // Toggle favorite
    const updated = await prisma.jobMatchCache.update({
      where: {
        userId_jobId: {
          userId: req.user.id,
          jobId: id,
        },
      },
      data: {
        isFavorite: !existingCache.isFavorite,
      },
    });
    isFavorite = updated.isFavorite;
  } else {
    // Create new cache entry with favorite
    await prisma.jobMatchCache.create({
      data: {
        userId: req.user.id,
        jobId: id,
        matchScore: 0,
        isFavorite: true,
      },
    });
    isFavorite = true;
  }

  res.json({
    success: true,
    message: isFavorite ? 'Job added to favorites' : 'Job removed from favorites',
    data: { isFavorite },
  });
});

/**
 * Hide job
 * POST /api/v1/jobs/:id/hide
 */
export const hideJob = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', true, 'UNAUTHORIZED');
  }

  const { id } = req.params;

  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found', true, 'NOT_FOUND');
  }

  // Get or create match cache
  const existingCache = await prisma.jobMatchCache.findUnique({
    where: {
      userId_jobId: {
        userId: req.user.id,
        jobId: id,
      },
    },
  });

  if (existingCache) {
    await prisma.jobMatchCache.update({
      where: {
        userId_jobId: {
          userId: req.user.id,
          jobId: id,
        },
      },
      data: {
        isHidden: true,
      },
    });
  } else {
    await prisma.jobMatchCache.create({
      data: {
        userId: req.user.id,
        jobId: id,
        matchScore: 0,
        isHidden: true,
      },
    });
  }

  res.json({
    success: true,
    message: 'Job hidden successfully',
  });
});

/**
 * Get job stats (admin only)
 * GET /api/v1/jobs/stats
 */
export const getJobStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const totalJobs = await prisma.job.count();
  const activeJobs = await prisma.job.count({ where: { status: 'ACTIVE' } });
  
  const newThisWeek = await prisma.job.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const topCompanies = await prisma.job.groupBy({
    by: ['company'],
    _count: {
      company: true,
    },
    orderBy: {
      _count: {
        company: 'desc',
      },
    },
    take: 10,
  });

  res.json({
    success: true,
    data: {
      total: totalJobs,
      active: activeJobs,
      newThisWeek,
      topCompanies: topCompanies.map((c) => ({
        company: c.company,
        count: c._count.company,
      })),
    },
  });
});
