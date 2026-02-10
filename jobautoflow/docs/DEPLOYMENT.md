# JobAutoFlow - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker 24.0+ and Docker Compose 2.0+
- Node.js 20 LTS (for local development)
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)
- Git

### Cloud Services Accounts
- Stripe account (payments)
- SendGrid account (emails)
- OpenAI account (AI matching)
- AWS/GCP/Azure account (hosting)
- Domain name

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/jobautoflow.git
cd jobautoflow
```

### 2. Create Environment Files

#### Backend Environment
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your actual values:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/jobautoflow

# JWT Secrets (generate strong random strings)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG.xxx

# OpenAI
OPENAI_API_KEY=sk-...
```

#### Frontend Environment
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Local Development

### Option 1: Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# View logs
docker-compose logs -f backend
```

### Option 2: Manual Setup

#### 1. Start Infrastructure
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

#### 2. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

#### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Docker Deployment

### Build and Deploy

```bash
# Build all images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Scale backend instances
docker-compose up -d --scale backend=3
```

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

---

## Production Deployment

### AWS Deployment (ECS/Fargate)

#### 1. Create ECR Repositories
```bash
aws ecr create-repository --repository-name jobautoflow-backend
aws ecr create-repository --repository-name jobautoflow-frontend
```

#### 2. Build and Push Images
```bash
# Login to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push backend
docker build -t jobautoflow-backend ./backend
docker tag jobautoflow-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/jobautoflow-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/jobautoflow-backend:latest

# Build and push frontend
docker build -t jobautoflow-frontend ./frontend
docker tag jobautoflow-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/jobautoflow-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/jobautoflow-frontend:latest
```

#### 3. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name jobautoflow-cluster
```

#### 4. Create Task Definitions and Services
Use the AWS Console or CloudFormation/Terraform to create:
- Task definitions for backend, frontend, worker
- ECS Services
- Application Load Balancer
- Auto Scaling policies

### GCP Deployment (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --config cloudbuild.yaml

# Deploy backend
gcloud run deploy jobautoflow-backend \
  --image gcr.io/$PROJECT_ID/jobautoflow-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy jobautoflow-frontend \
  --image gcr.io/$PROJECT_ID/jobautoflow-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Deployment (Container Instances)

```bash
# Create resource group
az group create --name jobautoflow-rg --location eastus

# Create container registry
az acr create --resource-group jobautoflow-rg --name jobautoflowacr --sku Basic

# Build and push images
az acr build --registry jobautoflowacr --image jobautoflow-backend ./backend
az acr build --registry jobautoflowacr --image jobautoflow-frontend ./frontend

# Deploy containers
az container create \
  --resource-group jobautoflow-rg \
  --name jobautoflow-backend \
  --image jobautoflowacr.azurecr.io/jobautoflow-backend \
  --dns-name-label jobautoflow-backend \
  --ports 5000
```

---

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
docker run -it --rm \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/nginx/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com

# Auto-renewal (add to crontab)
0 12 * * * docker run -it --rm \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/nginx/www:/var/www/certbot" \
  certbot/certbot renew
```

### Using CloudFlare (Recommended)

1. Sign up for CloudFlare
2. Add your domain
3. Update nameservers
4. Enable "Always Use HTTPS"
5. Set SSL/TLS mode to "Full (strict)"

---

## Monitoring & Logging

### Setup DataDog

```bash
# Install agent
docker run -d --name datadog-agent \
  -e DD_API_KEY=$DATADOG_API_KEY \
  -e DD_SITE=datadoghq.com \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc/:/host/proc/:ro \
  -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
  datadog/agent:latest
```

### Setup Sentry

Add to `backend/.env`:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup (add to crontab)
0 2 * * * docker exec jobautoflow-postgres pg_dump -U jobautoflow jobautoflow > /backups/jobautoflow_$(date +\%Y\%m\%d).sql

# Manual backup
docker exec jobautoflow-postgres pg_dump -U jobautoflow jobautoflow > backup.sql

# Restore from backup
docker exec -i jobautoflow-postgres psql -U jobautoflow jobautoflow < backup.sql
```

### S3 Backup (AWS)

```bash
# Sync to S3
aws s3 sync /backups s3://jobautoflow-backups/

# Set lifecycle policy for automatic deletion
aws s3api put-bucket-lifecycle-configuration \
  --bucket jobautoflow-backups \
  --lifecycle-configuration file://lifecycle.json
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres
```

#### 2. Prisma Migration Failed
```bash
# Reset migrations
docker-compose exec backend npx prisma migrate reset

# Deploy migrations
docker-compose exec backend npx prisma migrate deploy
```

#### 3. Redis Connection Failed
```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### 4. Out of Memory
```bash
# Check memory usage
docker stats

# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Performance Tuning

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Increase PostgreSQL connections
docker-compose exec postgres psql -U jobautoflow -c "ALTER SYSTEM SET max_connections = 200;"

# Redis memory optimization
docker-compose exec redis redis-cli CONFIG SET maxmemory 256mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
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
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push images
        run: |
          docker build -t $ECR_REGISTRY/jobautoflow-backend:$GITHUB_SHA ./backend
          docker push $ECR_REGISTRY/jobautoflow-backend:$GITHUB_SHA
          docker build -t $ECR_REGISTRY/jobautoflow-frontend:$GITHUB_SHA ./frontend
          docker push $ECR_REGISTRY/jobautoflow-frontend:$GITHUB_SHA
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster jobautoflow-cluster --service backend --force-new-deployment
```

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Rotate API keys regularly
- [ ] Enable 2FA for admin accounts
- [ ] Set up WAF (CloudFlare/AWS WAF)
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## Support

For deployment support:
- Email: devops@jobautoflow.com
- Slack: #deployment-support
- Documentation: https://docs.jobautoflow.com
