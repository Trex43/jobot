# 🚀 JobAutoFlow - Quick Start Guide

> **Deploy your job aggregation platform in 5 minutes (FREE) or 30 minutes (PRO)**

---

## ⚡ Option 1: FREE Deployment (5 Minutes)

### Step 1: Create Free Accounts (2 min)
Click these links and sign up with GitHub:
- [Render](https://render.com) - Backend hosting
- [Vercel](https://vercel.com) - Frontend hosting
- [Supabase](https://supabase.com) - Database
- [Upstash](https://upstash.com) - Redis cache

### Step 2: Push Code to GitHub (1 min)
```bash
cd jobautoflow
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/jobautoflow.git
git push -u origin main
```

### Step 3: Deploy Backend to Render (1 min)
1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Click **Apply** - Render reads `render.yaml`
5. Add environment variables in Render dashboard

### Step 4: Deploy Frontend to Vercel (1 min)
1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repo
4. Framework: **Vite**
5. Root Directory: `frontend`
6. Click **Deploy**

### ✅ Done!
- **Frontend**: `https://jobautoflow.vercel.app`
- **Backend**: `https://jobautoflow-api.onrender.com`

---

## 💼 Option 2: PRO Deployment (30 Minutes)

### Step 1: Setup AWS (10 min)
```bash
# Install AWS CLI
brew install awscli  # macOS
# or
sudo apt-get install awscli  # Ubuntu

# Configure AWS
aws configure
# Enter: Access Key ID, Secret Key, region (us-east-1)
```

### Step 2: Deploy Infrastructure (15 min)
```bash
cd jobautoflow

# Deploy VPC
aws cloudformation create-stack \
  --stack-name jobautoflow-vpc \
  --template-body file://infrastructure/vpc.yml

# Create database
aws rds create-db-instance \
  --db-instance-identifier jobautoflow-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username postgres \
  --master-user-password YOUR_STRONG_PASSWORD

# Create ECS cluster
aws ecs create-cluster --cluster-name jobautoflow-cluster
```

### Step 3: Deploy Application (5 min)
```bash
# Build and push Docker image
aws ecr create-repository --repository-name jobautoflow-backend
aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t jobautoflow-backend ./backend
docker tag jobautoflow-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/jobautoflow-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/jobautoflow-backend:latest

# Deploy to ECS
aws ecs create-service \
  --cluster jobautoflow-cluster \
  --service-name jobautoflow-backend \
  --task-definition jobautoflow-backend:1 \
  --desired-count 2
```

### ✅ Done!
- **Frontend**: `https://your-domain.com`
- **Backend**: `https://api.your-domain.com`

---

## 🔐 Required Environment Variables

### Copy and Fill
```bash
# For FREE deployment
cp .env.free.example .env

# For PRO deployment
cp .env.pro.example .env
```

### Quick Reference
| Variable | FREE Source | PRO Source |
|----------|-------------|------------|
| `DATABASE_URL` | Supabase → Settings → Database | RDS → Endpoint |
| `REDIS_HOST` | Upstash → Details | ElastiCache → Endpoint |
| `JWT_SECRET` | `openssl rand -base64 32` | Same |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (Test) | Stripe Dashboard (Live) |
| `SENDGRID_API_KEY` | SendGrid → Settings → API Keys | Same |
| `OPENAI_API_KEY` | OpenAI → API Keys | Same |

---

## 🔄 CI/CD Setup

### Add GitHub Secrets
1. Go to GitHub → Your Repo → Settings → Secrets → Actions
2. Add these secrets:

**For FREE:**
```
RENDER_SERVICE_ID=your-render-service-id
RENDER_API_KEY=your-render-api-key
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

**For PRO:**
```
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/YOUR_ROLE
AWS_ACCOUNT_ID=your-aws-account-id
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

---

## 💾 Backup & Restore

### Create Backup
```bash
./scripts/backup.sh
```

### Restore from Backup
```bash
./scripts/backup.sh restore s3://bucket/database/file.sql.gz
```

---

## ↩️ Rollback

### Quick Rollback
```bash
# List versions
./scripts/rollback.sh list

# Rollback to previous
./scripts/rollback.sh previous

# Rollback to specific version
./scripts/rollback.sh version 5
```

---

## 📊 Monitoring

### Health Check
```bash
curl https://your-api.com/health
```

### View Logs
```bash
# FREE - Render
curl https://api.render.com/v1/services/SERVICE_ID/logs

# PRO - AWS
aws logs tail /ecs/jobautoflow --follow
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Service sleeping (FREE) | Use UptimeRobot to ping every 5 min |
| Database connection failed | Check `DATABASE_URL` format |
| CORS errors | Update `FRONTEND_URL` in backend env |
| Out of memory | FREE: upgrade plan; PRO: increase ECS memory |
| Migration failed | Run `npx prisma migrate status` |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [FREE-DEPLOYMENT.md](docs/FREE-DEPLOYMENT.md) | Complete FREE deployment guide |
| [PRO-DEPLOYMENT.md](docs/PRO-DEPLOYMENT.md) | Complete PRO deployment guide |
| [DEPLOYMENT-SUMMARY.md](docs/DEPLOYMENT-SUMMARY.md) | Side-by-side comparison |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |

---

## 🎯 Next Steps

1. ✅ Choose your deployment path (FREE or PRO)
2. ✅ Follow the step-by-step guide
3. ✅ Configure environment variables
4. ✅ Deploy your application
5. ✅ Setup monitoring
6. ✅ Configure backups

---

**Need Help?**
- 📧 Email: support@jobautoflow.com
- 💬 Slack: #deployment-help
- 📖 Docs: https://docs.jobautoflow.com

**Happy Deploying!** 🚀
