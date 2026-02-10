/**
 * TypeScript Type Definitions
 */

import { User, Job, Application, SubscriptionPlan } from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  path: string;
  message: string;
}

// User types
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface UserWithProfile extends UserResponse {
  profile?: UserProfileResponse;
  preferences?: UserPreferencesResponse;
}

export interface UserProfileResponse {
  headline?: string;
  summary?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceYears?: number;
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

export interface UserPreferencesResponse {
  jobTypes: string[];
  locations: string[];
  remotePreference: string;
  salaryMin?: number;
  salaryMax?: number;
  companySizes: string[];
  industries: string[];
  autoApplyEnabled: boolean;
  autoApplyThreshold: number;
  autoApplyMaxPerDay: number;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPush: boolean;
}

// Job types
export interface JobResponse {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  location?: string;
  locationType?: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  jobType?: string;
  experienceLevel?: string;
  skillsRequired: string[];
  postedAt?: Date;
  status: string;
  matchScore?: number;
  isFavorite?: boolean;
  isHidden?: boolean;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  remote?: boolean;
  jobType?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  postedWithin?: string;
}

// Application types
export interface ApplicationResponse {
  id: string;
  job: JobResponse;
  status: string;
  matchScore?: number;
  matchReasons: string[];
  appliedAt?: Date;
  responseAt?: Date;
  notes?: string;
  isAutoApplied: boolean;
  createdAt: Date;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  applied: number;
  viewed: number;
  shortlisted: number;
  interview: number;
  offer: number;
  rejected: number;
}

// Subscription types
export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

export interface SubscriptionResponse {
  id: string;
  plan: SubscriptionPlanResponse;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

// Portal types
export interface PortalResponse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  requiresAuth: boolean;
  isConnected?: boolean;
  lastSyncAt?: Date;
}

// Notification types
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Stats types
export interface UserStats {
  applications: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  jobs: {
    matched: number;
    viewed: number;
  };
  interviews: {
    scheduled: number;
    completed: number;
  };
  responseRate: number;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  applications: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  jobs: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    thisYear: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
  };
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
