-- JobAutoFlow Database Schema
-- PostgreSQL 16

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER PROFILES
-- =====================================================

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),
    summary TEXT,
    location VARCHAR(255),
    country_code VARCHAR(2),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    experience_years INTEGER,
    preferred_roles TEXT[],
    skills TEXT[],
    industries TEXT[],
    resume_url TEXT,
    resume_filename VARCHAR(255),
    linkedin_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    availability VARCHAR(50),
    notice_period INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_location ON user_profiles(location);
CREATE INDEX idx_profiles_skills ON user_profiles USING GIN(skills);

-- =====================================================
-- JOB PORTALS
-- =====================================================

CREATE TABLE job_portals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    website_url TEXT,
    api_endpoint TEXT,
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'none')),
    api_version VARCHAR(20),
    rate_limit_requests INTEGER DEFAULT 100,
    rate_limit_window INTEGER DEFAULT 3600,
    is_active BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_portal_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portal_id UUID NOT NULL REFERENCES job_portals(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    scope TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, portal_id)
);

CREATE INDEX idx_portal_connections_user ON user_portal_connections(user_id);
CREATE INDEX idx_portal_connections_portal ON user_portal_connections(portal_id);

-- =====================================================
-- JOBS
-- =====================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID REFERENCES job_portals(id) ON DELETE SET NULL,
    external_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_logo_url TEXT,
    company_website TEXT,
    location VARCHAR(255),
    location_type VARCHAR(50) CHECK (location_type IN ('onsite', 'remote', 'hybrid')),
    country_code VARCHAR(2),
    description TEXT NOT NULL,
    requirements TEXT[],
    responsibilities TEXT[],
    benefits TEXT[],
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'yearly',
    job_type VARCHAR(50) CHECK (job_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship')),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    skills_required TEXT[],
    industry VARCHAR(100),
    department VARCHAR(100),
    education_level VARCHAR(100),
    application_url TEXT,
    application_email VARCHAR(255),
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'filled', 'closed')),
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portal_id, external_id)
);

CREATE INDEX idx_jobs_portal ON jobs(portal_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_salary ON jobs(salary_min, salary_max);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills_required);
CREATE INDEX idx_jobs_search ON jobs USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- =====================================================
-- APPLICATIONS
-- =====================================================

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn')),
    match_score DECIMAL(5,2),
    match_reasons TEXT[],
    cover_letter TEXT,
    resume_version TEXT,
    resume_url TEXT,
    applied_at TIMESTAMP,
    response_at TIMESTAMP,
    follow_up_at TIMESTAMP,
    notes TEXT,
    portal_response JSONB,
    is_auto_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_match_score ON applications(match_score DESC);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- =====================================================
-- USER PREFERENCES
-- =====================================================

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    job_types VARCHAR(50)[],
    locations VARCHAR(255)[],
    remote_preference VARCHAR(50) CHECK (remote_preference IN ('onsite', 'remote', 'hybrid', 'any')),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    company_sizes VARCHAR(50)[],
    industries TEXT[],
    experience_levels VARCHAR(50)[],
    skills_to_highlight TEXT[],
    companies_to_avoid TEXT[],
    companies_preferred TEXT[],
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    auto_apply_threshold DECIMAL(5,2) DEFAULT 50.00,
    auto_apply_max_per_day INTEGER DEFAULT 10,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    notification_push BOOLEAN DEFAULT TRUE,
    notification_frequency VARCHAR(20) DEFAULT 'immediate',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SUBSCRIPTIONS & PAYMENTS
-- =====================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    canceled_at TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    invoice_url TEXT,
    receipt_url TEXT,
    failure_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('application', 'job_match', 'interview', 'subscription', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AI MATCHING CACHE
-- =====================================================

CREATE TABLE job_match_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) NOT NULL,
    match_details JSONB,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_match_cache_user ON job_match_cache(user_id);
CREATE INDEX idx_match_cache_score ON job_match_cache(user_id, match_score DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_portals_updated_at BEFORE UPDATE ON job_portals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_portal_connections_updated_at BEFORE UPDATE ON user_portal_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, sort_order) VALUES
('Free', 'Perfect for getting started', 0, 0, '["profile_creation", "5_auto_applies_monthly", "basic_matching", "email_support", "1_portal_connection"]'::jsonb, 1),
('Professional', 'Best for active job seekers', 2900, 2300, '["unlimited_auto_applies", "advanced_ai_matching", "smart_resume_optimization", "all_portals", "priority_support", "advanced_analytics", "interview_scheduler", "salary_insights"]'::jsonb, 2),
('Enterprise', 'For teams and agencies', 9900, 7900, '["everything_in_pro", "dedicated_manager", "custom_integrations", "team_collaboration", "api_access", "white_label", "sso", "custom_training"]'::jsonb, 3);

INSERT INTO job_portals (name, display_name, description, auth_type, is_active, requires_auth) VALUES
('linkedin', 'LinkedIn', 'World''s largest professional network', 'oauth2', TRUE, TRUE),
('indeed', 'Indeed', 'Leading job site with millions of jobs', 'api_key', TRUE, FALSE),
('glassdoor', 'Glassdoor', 'Job search with company reviews', 'oauth2', TRUE, TRUE),
('monster', 'Monster', 'Global online employment solution', 'api_key', TRUE, FALSE),
('ziprecruiter', 'ZipRecruiter', 'Job search marketplace', 'oauth2', TRUE, TRUE),
('careerbuilder', 'CareerBuilder', 'AI-powered hiring platform', 'api_key', TRUE, FALSE),
('simplyhired', 'SimplyHired', 'Job search engine', 'none', TRUE, FALSE),
('dice', 'Dice', 'Tech career marketplace', 'oauth2', TRUE, TRUE);

INSERT INTO system_settings (key, value, description) VALUES
('app_name', 'JobAutoFlow', 'Application name'),
('app_url', 'https://jobautoflow.com', 'Application URL'),
('support_email', 'support@jobautoflow.com', 'Support email address'),
('max_auto_apply_per_day', '10', 'Maximum auto-apply per day for free users'),
('match_threshold_default', '50', 'Default match threshold percentage'),
('job_scrape_interval_hours', '6', 'Job scraping interval in hours');
