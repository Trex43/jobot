/**
 * AI Job Matching Service
 * Calculates match scores between user profiles and jobs
 */

import OpenAI from 'openai';
import { UserProfile, Job } from '@prisma/client';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchResult {
  score: number;
  reasons: string[];
  details: {
    skillsMatch: number;
    experienceMatch: number;
    salaryMatch: number;
    locationMatch: number;
    overallFit: number;
  };
}

/**
 * Calculate match score between a user profile and a job
 */
export const calculateMatchScore = async (
  profile: UserProfile,
  job: Job
): Promise<MatchResult> => {
  try {
    // Use OpenAI for intelligent matching
    const prompt = buildMatchingPrompt(profile, job);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert job matching AI. Analyze the candidate profile and job description to calculate a match score (0-100) and provide detailed reasoning. Return ONLY a JSON object with no markdown formatting.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);

    return {
      score: Math.round(parsed.score),
      reasons: parsed.reasons || [],
      details: {
        skillsMatch: parsed.details?.skillsMatch || 0,
        experienceMatch: parsed.details?.experienceMatch || 0,
        salaryMatch: parsed.details?.salaryMatch || 0,
        locationMatch: parsed.details?.locationMatch || 0,
        overallFit: parsed.details?.overallFit || 0,
      },
    };
  } catch (error) {
    logger.error({ message: 'Error calculating match score', error, profileId: profile.userId, jobId: job.id });
    
    // Fallback to basic matching if AI fails
    return calculateBasicMatchScore(profile, job);
  }
};

/**
 * Build the matching prompt for OpenAI
 */
const buildMatchingPrompt = (profile: UserProfile, job: Job): string => {
  return `
Analyze the following candidate profile and job posting to calculate a match score.

CANDIDATE PROFILE:
- Headline: ${profile.headline || 'N/A'}
- Summary: ${profile.summary || 'N/A'}
- Skills: ${profile.skills?.join(', ') || 'N/A'}
- Experience Years: ${profile.experienceYears || 'N/A'}
- Preferred Roles: ${profile.preferredRoles?.join(', ') || 'N/A'}
- Location: ${profile.location || 'N/A'}
- Salary Expectation: ${profile.salaryMin ? `$${profile.salaryMin}-${profile.salaryMax}` : 'N/A'}
- Industries: ${profile.industries?.join(', ') || 'N/A'}

JOB POSTING:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description.substring(0, 1000)}...
- Required Skills: ${job.skillsRequired?.join(', ') || 'N/A'}
- Experience Level: ${job.experienceLevel || 'N/A'}
- Location: ${job.location || 'N/A'} (${job.locationType || 'N/A'})
- Salary Range: ${job.salaryMin ? `$${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}` : 'N/A'}
- Job Type: ${job.jobType || 'N/A'}

Calculate a match score (0-100) and provide:
1. Overall match score
2. Top 3-5 reasons for the match
3. Breakdown scores for: skills match, experience match, salary match, location match, overall fit

Return ONLY a JSON object in this exact format:
{
  "score": number,
  "reasons": ["reason1", "reason2", ...],
  "details": {
    "skillsMatch": number,
    "experienceMatch": number,
    "salaryMatch": number,
    "locationMatch": number,
    "overallFit": number
  }
}
`;
};

/**
 * Basic matching algorithm (fallback when AI is unavailable)
 */
const calculateBasicMatchScore = (profile: UserProfile, job: Job): MatchResult => {
  let score = 0;
  const reasons: string[] = [];
  const details = {
    skillsMatch: 0,
    experienceMatch: 0,
    salaryMatch: 0,
    locationMatch: 0,
    overallFit: 0,
  };

  // Skills matching (40% weight)
  if (profile.skills?.length && job.skillsRequired?.length) {
    const matchingSkills = profile.skills.filter((skill) =>
      job.skillsRequired!.some(
        (req) => req.toLowerCase().includes(skill.toLowerCase()) ||
                 skill.toLowerCase().includes(req.toLowerCase())
      )
    );
    details.skillsMatch = Math.round((matchingSkills.length / job.skillsRequired.length) * 100);
    score += details.skillsMatch * 0.4;
    
    if (matchingSkills.length > 0) {
      reasons.push(`Matches ${matchingSkills.length} required skills`);
    }
  }

  // Experience matching (20% weight)
  if (profile.experienceYears && job.experienceLevel) {
    const expMap: Record<string, number> = {
      ENTRY: 0,
      MID: 3,
      SENIOR: 5,
      EXECUTIVE: 8,
    };
    
    const requiredExp = expMap[job.experienceLevel] || 0;
    if (profile.experienceYears >= requiredExp) {
      details.experienceMatch = 100;
      reasons.push('Experience level matches requirements');
    } else {
      details.experienceMatch = Math.round((profile.experienceYears / requiredExp) * 100);
    }
    score += details.experienceMatch * 0.2;
  }

  // Salary matching (20% weight)
  if (profile.salaryMin && job.salaryMax) {
    if (profile.salaryMin <= job.salaryMax) {
      details.salaryMatch = 100;
      reasons.push('Salary expectations align');
    } else {
      details.salaryMatch = Math.round((job.salaryMax / profile.salaryMin) * 100);
    }
    score += details.salaryMatch * 0.2;
  }

  // Location matching (10% weight)
  if (profile.location && job.location) {
    const profileLoc = profile.location.toLowerCase();
    const jobLoc = job.location.toLowerCase();
    
    if (profileLoc === jobLoc || jobLoc.includes(profileLoc) || profileLoc.includes(jobLoc)) {
      details.locationMatch = 100;
      reasons.push('Location matches preference');
    } else if (job.locationType === 'REMOTE') {
      details.locationMatch = 80;
      reasons.push('Remote position available');
    }
    score += details.locationMatch * 0.1;
  }

  // Role matching (10% weight)
  if (profile.preferredRoles?.length) {
    const titleMatch = profile.preferredRoles.some((role) =>
      job.title.toLowerCase().includes(role.toLowerCase())
    );
    if (titleMatch) {
      details.overallFit = 100;
      reasons.push('Job title matches preferred roles');
    }
    score += details.overallFit * 0.1;
  }

  return {
    score: Math.round(score),
    reasons: reasons.length > 0 ? reasons : ['General profile match'],
    details,
  };
};

/**
 * Batch calculate match scores for multiple jobs
 */
export const batchCalculateMatchScores = async (
  profile: UserProfile,
  jobs: Job[]
): Promise<Map<string, MatchResult>> => {
  const results = new Map<string, MatchResult>();

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (job) => {
      const result = await calculateMatchScore(profile, job);
      results.set(job.id, result);
    });

    await Promise.all(batchPromises);

    // Small delay between batches
    if (i + batchSize < jobs.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};
