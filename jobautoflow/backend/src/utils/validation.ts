/**
 * Zod Validation Schemas
 * Input validation for all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// Auth Validation
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// ============================================================================
// User Validation
// ============================================================================

export const updateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
});

// ============================================================================
// Profile Validation
// ============================================================================

export const updateProfileSchema = z.object({
  headline: z.string().max(255).optional(),
  summary: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
  countryCode: z.string().length(2).optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  salaryCurrency: z.string().length(3).default('USD'),
  experienceYears: z.number().int().min(0).max(50).optional(),
  preferredRoles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  availability: z.string().optional(),
  noticePeriod: z.number().int().min(0).optional(),
});

// ============================================================================
// Preferences Validation
// ============================================================================

export const updatePreferencesSchema = z.object({
  jobTypes: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'])).optional(),
  locations: z.array(z.string()).optional(),
  remotePreference: z.enum(['ONSITE', 'REMOTE', 'HYBRID', 'ANY']).optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  salaryCurrency: z.string().length(3).optional(),
  companySizes: z.array(z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'])).optional(),
  industries: z.array(z.string()).optional(),
  experienceLevels: z.array(z.enum(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'])).optional(),
  skillsToHighlight: z.array(z.string()).optional(),
  companiesToAvoid: z.array(z.string()).optional(),
  companiesPreferred: z.array(z.string()).optional(),
  autoApplyEnabled: z.boolean().optional(),
  autoApplyThreshold: z.number().min(0).max(100).optional(),
  autoApplyMaxPerDay: z.number().int().min(1).max(100).optional(),
  notificationEmail: z.boolean().optional(),
  notificationSms: z.boolean().optional(),
  notificationPush: z.boolean().optional(),
  notificationFrequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY']).optional(),
  timezone: z.string().optional(),
});

// ============================================================================
// Job Validation
// ============================================================================

export const jobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  jobType: z.array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'])).optional(),
  experienceLevel: z.array(z.enum(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'])).optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  skills: z.array(z.string()).optional(),
  postedWithin: z.enum(['24h', '7d', '30d', 'all']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'date', 'salary', 'match']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Application Validation
// ============================================================================

export const createApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  coverLetter: z.string().max(5000).optional(),
  resumeVersion: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(['PENDING', 'APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// Subscription Validation
// ============================================================================

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
});

// ============================================================================
// Pagination Validation
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Admin Validation
// ============================================================================

export const updateUserAdminSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  emailVerified: z.boolean().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  currency: z.string().length(3).default('USD'),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
