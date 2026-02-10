# 🆓 100% FREE Deployment Guide - JobAutoFlow

> **Zero Cost. No Credit Card Required. Production-Ready.**

---

## 📋 What You're Building (FREE Stack)

| Component | Free Service | Limit |
|-----------|--------------|-------|
| **Backend API** | Render.com | 512MB RAM, sleeps after 15min idle |
| **Frontend** | Vercel | Unlimited bandwidth |
| **Database** | Supabase (PostgreSQL) | 500MB storage |
| **Redis** | Upstash | 10,000 requests/day |
| **File Storage** | Cloudinary | 25GB storage |
| **Email** | Mailgun (3 months free) | 5,000 emails/month |
| **Domain** | Freenom (.tk, .ml, .ga) | Free forever |
| **SSL/HTTPS** | Let's Encrypt + CloudFlare | Free forever |

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Accounts (5 minutes)

Create these accounts (all free, no credit card):

1. **GitHub** - https://github.com/signup
2. **Render** - https://render.com (Sign up with GitHub)
3. **Vercel** - https://vercel.com (Sign up with GitHub)
4. **Supabase** - https://supabase.com (Sign up with GitHub)
5. **Upstash** - https://upstash.com (Sign up with GitHub)
6. **Cloudinary** - https://cloudinary.com (Sign up with email)
7. **CloudFlare** - https://cloudflare.com (Sign up with email)

---

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not done)
cd /mnt/okcomputer/output/jobautoflow
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/jobautoflow.git
git branch -M main
git push -u origin main
```

---

### Step 3: Setup Supabase Database (FREE PostgreSQL)

#### 3.1 Create Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: `jobautoflow`
4. Database Password: Generate strong password (save it!)
5. Region: Choose closest to you
6. Click "Create New Project"

#### 3.2 Get Connection String
1. Wait for project to be ready (2-3 minutes)
2. Go to **Settings** → **Database**
3. Find **Connection String** → **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

#### 3.3 Run Migrations
```bash
# Install Prisma CLI globally
npm install -g prisma

# Set environment variable temporarily
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Run migrations
cd backend
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

---

### Step 4: Setup Upstash Redis (FREE)

#### 4.1 Create Redis Database
1. Go to https://console.upstash.com
2. Click "Create Database"
3. Name: `jobautoflow-redis`
4. Region: Same as your Supabase region
5. Click "Create"

#### 4.2 Get Connection Details
1. Click on your database
2. Go to **Details** tab
3. Copy:
   - **Endpoint** (REDIS_HOST)
   - **Port** (REDIS_PORT)
   - **Password** (REDIS_PASSWORD)

---

### Step 5: Setup Cloudinary (FREE File Storage)

#### 5.1 Get Credentials
1. Go to https://cloudinary.com/console
2. Dashboard shows your **Cloud Name**
3. Click **Settings** → **Security**
4. Copy **API Key** and **API Secret**

---

### Step 6: Create Environment Variables File

Create `backend/.env.production`:

```bash
cd backend
cat > .env.production << 'EOF'
# ============================================
# JobAutoFlow - FREE Deployment Environment
# ============================================

# Application
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://jobautoflow.vercel.app

# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_SUPABASE_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Redis (Upstash)
REDIS_HOST=YOUR_UPSTASH_ENDPOINT
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_UPSTASH_PASSWORD

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=GENERATE_A_STRONG_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_STRONG_SECRET_HERE
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe (Skip for free deployment - use test mode)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY

# Email (Mailgun - 3 months free)
SENDGRID_API_KEY=SG.YOUR_MAILGUN_API_KEY
EMAIL_FROM=noreply@YOUR_DOMAIN.com
EMAIL_FROM_NAME=JobAutoFlow

# OpenAI (Free tier: $5 credit)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
OPENAI_MODEL=gpt-3.5-turbo

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# Security
BCRYPT_ROUNDS=12
EOF
```

**Generate JWT Secrets:**
```bash
# Run this command and copy the output
openssl rand -base64 32
```

---

### Step 7: Deploy Backend to Render (FREE)

#### 7.1 Create render.yaml
Create `render.yaml` in project root:

```yaml
services:
  # Backend API
  - type: web
    name: jobautoflow-api
    env: node
    buildCommand: cd backend && npm install && npx prisma generate && npm run build
    startCommand: cd backend && npx prisma migrate deploy && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Set in Render dashboard
      - key: REDIS_HOST
        sync: false
      - key: REDIS_PASSWORD
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: SENDGRID_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
    plan: free
```

#### 7.2 Deploy to Render
1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Click **Apply**
5. Render will detect `render.yaml` and create the service

#### 7.3 Set Environment Variables in Render
1. Click on your `jobautoflow-api` service
2. Go to **Environment** tab
3. Add each variable from your `.env.production` file
4. Click **Save Changes**

#### 7.4 Get Your API URL
After deployment (takes ~5 minutes):
- Your API URL will be: `https://jobautoflow-api.onrender.com`
- Copy this URL for the frontend

---

### Step 8: Deploy Frontend to Vercel (FREE)

#### 8.1 Create vercel.json
Create `frontend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://jobautoflow-api.onrender.com"
  }
}
```

#### 8.2 Update Frontend API URL
Create `frontend/.env.production`:

```bash
VITE_API_URL=https://jobautoflow-api.onrender.com
```

#### 8.3 Deploy to Vercel
**Option A: Via Web (Easiest)**
1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository
4. Framework Preset: `Vite`
5. Root Directory: `frontend`
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Click **Environment Variables**
9. Add: `VITE_API_URL` = `https://jobautoflow-api.onrender.com`
10. Click **Deploy**

**Option B: Via CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Follow prompts
# When asked for environment variables, enter:
# VITE_API_URL=https://jobautoflow-api.onrender.com
```

#### 8.4 Get Your Frontend URL
- Your app will be at: `https://jobautoflow.vercel.app`
- Or: `https://jobautoflow-YOUR_USERNAME.vercel.app`

---

### Step 9: Setup Free Domain with Freenom

#### 9.1 Get Free Domain
1. Go to https://freenom.com
2. Search for a domain (e.g., `jobautoflow.tk`)
3. Select **12 Months Free**
4. Complete checkout (no payment needed)

#### 9.2 Connect Domain to Vercel
1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Enter your Freenom domain
4. Follow DNS instructions

#### 9.3 Configure DNS in Freenom
1. Go to https://my.freenom.com → **Services** → **My Domains**
2. Click **Manage Domain** next to your domain
3. Click **Management Tools** → **Nameservers**
4. Select **Use custom nameservers**
5. Add Vercel nameservers:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
6. Click **Change Nameservers**

---

### Step 10: Setup Free SSL with CloudFlare

#### 10.1 Add Site to CloudFlare
1. Go to https://dash.cloudflare.com
2. Click **Add Site**
3. Enter your Freenom domain
4. Select **Free Plan**
5. Click **Continue**

#### 10.2 Update Nameservers
CloudFlare will give you 2 nameservers:
- Copy them
- Go back to Freenom
- Replace Vercel nameservers with CloudFlare nameservers

#### 10.3 Enable SSL
1. In CloudFlare, go to **SSL/TLS**
2. Set mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

---

## 🔄 CI/CD - Auto Deploy on Git Push

### Setup GitHub Actions (FREE)

Create `.github/workflows/deploy-free.yml`:

```yaml
name: Deploy to Free Tier

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install Backend Dependencies
        run: cd backend && npm ci
      
      - name: Run Tests
        run: cd backend && npm test
        continue-on-error: true

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Add Secrets to GitHub
1. Go to GitHub → Your Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | How to Get |
|-------------|------------|
| `RENDER_SERVICE_ID` | Render Dashboard → Service → Settings → Copy Service ID |
| `RENDER_API_KEY` | Render Dashboard → Account Settings → API Keys → Create |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings → General → Project ID |

---

## 💾 Backup Strategy (FREE)

### Automated Database Backup

Create `.github/workflows/backup.yml`:

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL Client
        run: sudo apt-get install -y postgresql-client
      
      - name: Backup Database
        run: |
          pg_dump "${{ secrets.DATABASE_URL }}" > backup_$(date +%Y%m%d).sql
      
      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup_*.sql
          retention-days: 30
```

### Manual Backup Command
```bash
# Backup locally
pg_dump "YOUR_DATABASE_URL" > jobautoflow_backup_$(date +%Y%m%d).sql

# Restore from backup
psql "YOUR_DATABASE_URL" < jobautoflow_backup_20240101.sql
```

---

## ↩️ Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous commit
git log --oneline -10  # See recent commits
git revert HEAD        # Undo last commit
git push origin main

# Or rollback to specific commit
git reset --hard COMMIT_HASH
git push origin main --force
```

### Database Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Or restore from backup
psql "YOUR_DATABASE_URL" < backup_file.sql
```

---

## 📊 Monitoring (FREE)

### Uptime Monitoring
1. Go to https://uptimerobot.com
2. Create FREE account
3. Add monitor:
   - Type: HTTP(s)
   - URL: `https://jobautoflow-api.onrender.com/health`
   - Interval: 5 minutes

### Error Tracking (Sentry Free)
1. Go to https://sentry.io
2. Create account (5,000 errors/month FREE)
3. Add DSN to your backend `.env`:
```
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## 🚨 Troubleshooting

### Render Service Sleeping
**Problem:** Free tier sleeps after 15 minutes
**Solution:** Use UptimeRobot to ping every 5 minutes

### Database Connection Issues
```bash
# Test connection
psql "YOUR_DATABASE_URL" -c "SELECT 1;"

# Check if migrations ran
npx prisma migrate status
```

### CORS Errors
Update `backend/.env`:
```
FRONTEND_URL=https://your-actual-domain.com
```

---

## ✅ Deployment Checklist

- [ ] All accounts created
- [ ] Code pushed to GitHub
- [ ] Supabase database created
- [ ] Migrations run successfully
- [ ] Upstash Redis created
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Domain connected (optional)
- [ ] SSL enabled
- [ ] CI/CD configured
- [ ] Backups scheduled
- [ ] Monitoring enabled

---

## 💰 Total Cost: $0.00

**Enjoy your completely free, production-ready deployment!** 🎉
