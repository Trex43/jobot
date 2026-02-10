# JobAutoFlow - System Architecture

## Executive Summary

JobAutoFlow is a production-grade job aggregation and auto-application platform that integrates with 50+ job portals, uses AI to match candidates with 50%+ accuracy, and automates the application process.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand + React Query (TanStack Query)
- **UI Library**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **API Style**: RESTful + WebSocket for real-time updates
- **Authentication**: JWT (Access + Refresh tokens) + OAuth 2.0
- **Validation**: Zod
- **Documentation**: OpenAPI/Swagger

### Database
- **Primary**: PostgreSQL 16 (relational data)
- **Cache**: Redis (sessions, rate limiting, job queues)
- **Search**: Elasticsearch (job search, full-text)
- **File Storage**: AWS S3 (resumes, documents)

### External Services
- **Payments**: Stripe (subscriptions)
- **Email**: SendGrid (transactional) + AWS SES (bulk)
- **SMS**: Twilio
- **Job APIs**: LinkedIn, Indeed, Glassdoor, etc.
- **AI/ML**: OpenAI API (matching algorithm)
- **Monitoring**: Sentry + DataDog

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Hosting**: AWS/GCP/Azure
- **CDN**: CloudFlare
- **Reverse Proxy**: Nginx

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Web App (React)    │    Mobile App (React Native)    │    Admin Panel  │
└─────────────────────┴─────────────────────────────────┴─────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Nginx)                           │
│                    Rate Limiting │ SSL │ Load Balancing                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌───────────────────────┐ ┌───────────────┐ ┌─────────────────┐
│   Backend API (Node)  │ │  WebSocket    │ │  Admin API      │
│   - Auth Service      │ │  Server       │ │  - Analytics    │
│   - Job Service       │ │               │ │  - User Mgmt    │
│   - Payment Service   │ │               │ │  - Settings     │
└───────────────────────┘ └───────────────┘ └─────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Auth Service │ Job Service │ Payment Service │ Notification Service    │
│  User Service │ AI Service  │ Apply Service   │ Analytics Service       │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL    │    Redis      │    Elasticsearch    │    AWS S3        │
│  - Users       │    - Cache    │    - Job Search     │    - Files       │
│  - Jobs        │    - Sessions │    - Analytics      │    - Backups     │
│  - Applications│    - Queues   │                     │                  │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                               │
├─────────────────────────────────────────────────────────────────────────┤
│  LinkedIn API │ Indeed API │ Glassdoor API │ 50+ Job Portals            │
│  Stripe       │ SendGrid   │ OpenAI API    │ OAuth Providers            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Users & Authentication
users (id, email, password_hash, first_name, last_name, phone, avatar_url, 
       role, status, email_verified, created_at, updated_at)

user_profiles (user_id, headline, summary, location, salary_min, salary_max,
               experience_years, preferred_roles, skills, resume_url)

refresh_tokens (id, user_id, token, expires_at, created_at)

-- Job Portals Integration
job_portals (id, name, display_name, api_endpoint, auth_type, 
             is_active, rate_limit, created_at)

user_portal_connections (id, user_id, portal_id, access_token, refresh_token,
                         expires_at, is_active, last_sync_at, created_at)

-- Jobs
jobs (id, portal_id, external_id, title, company, location, description,
      requirements, salary_min, salary_max, salary_currency, job_type,
      experience_level, skills_required, application_url, posted_at, expires_at,
      status, created_at, updated_at)

-- Applications
applications (id, user_id, job_id, status, match_score, cover_letter,
              resume_version, applied_at, response_at, notes, created_at)

-- User Preferences
user_preferences (user_id, job_types, locations, remote_preference,
                  salary_min, salary_max, company_sizes, industries,
                  auto_apply_enabled, auto_apply_threshold, created_at)

-- Subscriptions & Payments
subscription_plans (id, name, description, price_monthly, price_yearly,
                    features, is_active, created_at)

subscriptions (id, user_id, plan_id, status, current_period_start,
               current_period_end, cancel_at_period_end, created_at)

payments (id, subscription_id, amount, currency, status, payment_method,
          stripe_payment_intent_id, created_at)

-- Notifications
notifications (id, user_id, type, title, message, data, is_read, created_at)

-- Admin
admin_logs (id, admin_id, action, entity_type, entity_id, changes, created_at)

system_settings (key, value, description, updated_at)
```

## Security Architecture

### Authentication Flow
1. User registers/logs in → JWT Access Token (15 min) + Refresh Token (7 days)
2. Access token sent in Authorization header
3. Refresh token stored in HTTP-only cookie
4. OAuth for job portal connections

### Security Measures
- bcrypt for password hashing (cost factor 12)
- Helmet.js for HTTP security headers
- CORS configuration
- Rate limiting (100 req/min per IP, 1000 req/min per user)
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF tokens for state-changing operations

## API Design

### RESTful Endpoints

```
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

# User
GET    /api/v1/users/me
PUT    /api/v1/users/me
PUT    /api/v1/users/me/password
DELETE /api/v1/users/me
GET    /api/v1/users/me/stats

# Profile
GET    /api/v1/profile
PUT    /api/v1/profile
POST   /api/v1/profile/resume
DELETE /api/v1/profile/resume

# Job Portals
GET    /api/v1/portals
POST   /api/v1/portals/:id/connect
DELETE /api/v1/portals/:id/disconnect
GET    /api/v1/portals/:id/status

# Jobs
GET    /api/v1/jobs
GET    /api/v1/jobs/:id
POST   /api/v1/jobs/:id/apply
GET    /api/v1/jobs/matches
POST   /api/v1/jobs/search

# Applications
GET    /api/v1/applications
GET    /api/v1/applications/:id
PUT    /api/v1/applications/:id
DELETE /api/v1/applications/:id
GET    /api/v1/applications/stats

# Preferences
GET    /api/v1/preferences
PUT    /api/v1/preferences

# Subscriptions
GET    /api/v1/subscriptions/plans
POST   /api/v1/subscriptions
PUT    /api/v1/subscriptions
DELETE /api/v1/subscriptions
GET    /api/v1/subscriptions/invoices

# Notifications
GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id

# Admin
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PUT    /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/stats
GET    /api/v1/admin/logs
```

## Scalability Strategy

### Horizontal Scaling
- Stateless API servers behind load balancer
- Database read replicas for queries
- Redis cluster for caching
- Message queues (Bull/Redis) for background jobs

### Performance Optimizations
- Database indexing on frequently queried columns
- API response caching (Redis)
- CDN for static assets
- Lazy loading for job listings
- Pagination (cursor-based for large datasets)

### Background Jobs
- Job scraping (every 6 hours)
- AI matching (on profile update, new jobs)
- Auto-apply (continuous)
- Email notifications (batched)
- Report generation (daily/weekly)

## Monitoring & Logging

### Metrics
- API response times
- Error rates
- Active users
- Job match accuracy
- Application success rate

### Logging
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing

## Deployment Strategy

### Environments
- Development (local Docker)
- Staging (cloud, production-like)
- Production (multi-region)

### CI/CD Pipeline
1. Code push → GitHub Actions
2. Run tests (unit, integration, e2e)
3. Build Docker images
4. Deploy to staging
5. Manual approval
6. Deploy to production (blue-green)

## Cost Estimation (Monthly)

| Service | Cost |
|---------|------|
| AWS EC2 (2x t3.medium) | $60 |
| RDS PostgreSQL (db.t3.small) | $25 |
| ElastiCache Redis | $15 |
| S3 Storage | $10 |
| SendGrid (100k emails) | $90 |
| Stripe (transaction fees) | 2.9% + $0.30 |
| OpenAI API | $50-200 |
| **Total** | **~$250-400** |
