# 💼 Professional Deployment Guide - JobAutoFlow

> **Enterprise-Grade. Maximum Performance. Zero Downtime.**

---

## 📋 What You're Building (Pro Stack)

| Component | Service | Cost/Month | Why Pro? |
|-----------|---------|------------|----------|
| **Backend API** | AWS ECS Fargate | ~$30 | Auto-scaling, never sleeps |
| **Frontend** | Vercel Pro | $20 | Analytics, more bandwidth |
| **Database** | AWS RDS PostgreSQL | ~$25 | Automated backups, Multi-AZ |
| **Redis** | AWS ElastiCache | ~$15 | Cluster mode, persistence |
| **File Storage** | AWS S3 | ~$5 | Unlimited, CDN-ready |
| **CDN** | CloudFlare Pro | $20 | Global cache, WAF |
| **Email** | SendGrid Pro | $90 | 100K emails, dedicated IP |
| **Domain** | Namecheap | $10/year | Professional TLD |
| **Monitoring** | DataDog | Free tier | APM, logs, metrics |
| **CI/CD** | GitHub Actions | Free | Unlimited public repos |

**Total: ~$165/month** for enterprise-grade infrastructure

---

## 🎯 Step-by-Step Deployment

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click **Create an AWS Account**
3. Enter email, password, account name
4. Add credit card (you'll get $300 free credits for 12 months!)
5. Complete identity verification
6. Select **Basic Support Plan** (free)

---

### Step 2: Install AWS CLI

```bash
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install awscli

# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
```

---

### Step 3: Configure AWS CLI

```bash
# Configure credentials
aws configure

# Enter:
# AWS Access Key ID: (create in IAM)
# AWS Secret Access Key: (create in IAM)
# Default region name: us-east-1
# Default output format: json
```

**Create IAM User:**
1. AWS Console → IAM → Users → Add User
2. Name: `jobautoflow-deploy`
3. Access type: **Programmatic access**
4. Attach policies: **AdministratorAccess** (for setup)
5. Save Access Key ID and Secret Access Key

---

### Step 4: Create VPC and Network Infrastructure

Create `infrastructure/vpc.yml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'JobAutoFlow VPC Infrastructure'

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: jobautoflow-vpc

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: jobautoflow-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: jobautoflow-public-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: jobautoflow-public-2

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: jobautoflow-private-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: jobautoflow-private-2

  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: jobautoflow-public-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: jobautoflow-private-rt

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable1

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: jobautoflow-vpc-id

  PublicSubnet1:
    Description: Public Subnet 1
    Value: !Ref PublicSubnet1
    Export:
      Name: jobautoflow-public-subnet-1

  PublicSubnet2:
    Description: Public Subnet 2
    Value: !Ref PublicSubnet2
    Export:
      Name: jobautoflow-public-subnet-2

  PrivateSubnet1:
    Description: Private Subnet 1
    Value: !Ref PrivateSubnet1
    Export:
      Name: jobautoflow-private-subnet-1

  PrivateSubnet2:
    Description: Private Subnet 2
    Value: !Ref PrivateSubnet2
    Export:
      Name: jobautoflow-private-subnet-2
```

**Deploy VPC:**
```bash
# Create infrastructure directory
mkdir -p infrastructure

# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name jobautoflow-vpc \
  --template-body file://infrastructure/vpc.yml \
  --capabilities CAPABILITY_IAM

# Wait for completion
aws cloudformation wait stack-create-complete --stack-name jobautoflow-vpc

# Get outputs
aws cloudformation describe-stacks \
  --stack-name jobautoflow-vpc \
  --query 'Stacks[0].Outputs'
```

---

### Step 5: Create RDS PostgreSQL Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name jobautoflow-db-subnet \
  --db-subnet-group-description "DB subnet group for JobAutoFlow" \
  --subnet-ids '["subnet-xxxxx","subnet-yyyyy"]'

# Create database
aws rds create-db-instance \
  --db-instance-identifier jobautoflow-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --allocated-storage 20 \
  --storage-type gp2 \
  --master-username postgres \
  --master-user-password YOUR_STRONG_PASSWORD \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name jobautoflow-db-subnet \
  --publicly-accessible false \
  --backup-retention-period 7 \
  --multi-az false \
  --storage-encrypted \
  --enable-performance-insights \
  --performance-insights-retention-period 7

# Wait for database to be available
echo "Waiting for database..."
aws rds wait db-instance-available --db-instance-identifier jobautoflow-db

# Get database endpoint
aws rds describe-db-instances \
  --db-instance-identifier jobautoflow-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

---

### Step 6: Create ElastiCache Redis

```bash
# Create Redis subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name jobautoflow-redis \
  --cache-subnet-group-description "Redis for JobAutoFlow" \
  --subnet-ids '["subnet-xxxxx","subnet-yyyyy"]'

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id jobautoflow-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --cache-subnet-group-name jobautoflow-redis

# Get Redis endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id jobautoflow-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

---

### Step 7: Create ECS Cluster (Fargate)

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name jobautoflow-cluster \
  --settings name=containerInsights,value=enabled \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1,base=1 \
    capacityProvider=FARGATE_SPOT,weight=3

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/jobautoflow

# Set log retention
aws logs put-retention-policy \
  --log-group-name /ecs/jobautoflow \
  --retention-in-days 30
```

---

### Step 8: Create Application Load Balancer

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name jobautoflow-alb-sg \
  --description "Security group for ALB" \
  --vpc-id vpc-xxxxx

# Allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ALB
aws elbv2 create-load-balancer \
  --name jobautoflow-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
  --name jobautoflow-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

### Step 9: Create ECS Task Definition

Create `infrastructure/task-definition.json`:

```json
{
  "family": "jobautoflow-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/jobautoflow-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:...:secret:jobautoflow/database-url"
        },
        {
          "name": "REDIS_HOST",
          "valueFrom": "arn:aws:secretsmanager:...:secret:jobautoflow/redis-host"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:...:secret:jobautoflow/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/jobautoflow",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Register task definition:**
```bash
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/task-definition.json
```

---

### Step 10: Store Secrets in AWS Secrets Manager

```bash
# Create database URL secret
aws secretsmanager create-secret \
  --name jobautoflow/database-url \
  --description "Database connection string" \
  --secret-string "postgresql://postgres:PASSWORD@jobautoflow-db.xxxxx.us-east-1.rds.amazonaws.com:5432/jobautoflow"

# Create Redis host secret
aws secretsmanager create-secret \
  --name jobautoflow/redis-host \
  --description "Redis endpoint" \
  --secret-string "jobautoflow-redis.xxxxx.cache.amazonaws.com"

# Create JWT secret
aws secretsmanager create-secret \
  --name jobautoflow/jwt-secret \
  --description "JWT signing secret" \
  --secret-string "$(openssl rand -base64 32)"
```

---

### Step 11: Create ECR Repository and Deploy

```bash
# Create ECR repository
aws ecr create-repository --repository-name jobautoflow-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t jobautoflow-backend ./backend
docker tag jobautoflow-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/jobautoflow-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/jobautoflow-backend:latest

# Create ECS service
aws ecs create-service \
  --cluster jobautoflow-cluster \
  --service-name jobautoflow-backend \
  --task-definition jobautoflow-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=5000

# Enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/jobautoflow-cluster/jobautoflow-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/jobautoflow-cluster/jobautoflow-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name jobautoflow-scale-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://infrastructure/scaling-policy.json
```

---

### Step 12: Deploy Frontend to Vercel Pro

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd frontend
vercel link

# Deploy to production
vercel --prod

# Or use GitHub integration for auto-deploy
```

---

### Step 13: Setup Domain and SSL

#### Buy Domain (Namecheap)
1. Go to https://namecheap.com
2. Search for your domain (e.g., `jobautoflow.com`)
3. Purchase (~$10/year)

#### Configure DNS
1. In Namecheap, go to **Domain List** → **Manage**
2. Go to **Advanced DNS** tab
3. Add records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | ALB_IP_ADDRESS | Automatic |
| CNAME | www | jobautoflow.com | Automatic |
| CNAME | api | ALB_DNS_NAME | Automatic |
| CNAME | app | cname.vercel-dns.com | Automatic |

#### Setup SSL with ACM
```bash
# Request certificate
aws acm request-certificate \
  --domain-name jobautoflow.com \
  --subject-alternative-names www.jobautoflow.com api.jobautoflow.com \
  --validation-method DNS \
  --region us-east-1

# Add validation records to Namecheap (follow ACM instructions)
# Then update ALB listener to use HTTPS
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy-pro.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: jobautoflow-backend
  ECS_CLUSTER: jobautoflow-cluster
  ECS_SERVICE: jobautoflow-backend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run linter
        run: cd backend && npm run lint
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    outputs:
      image-tag: ${{ steps.build-image.outputs.image-tag }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image-tag=$IMAGE_TAG" >> $GITHUB_OUTPUT

  deploy-backend:
    needs: build-and-push
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition jobautoflow-backend \
            --query taskDefinition > task-definition.json
      
      - name: Fill in image ID
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: backend
          image: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:${{ needs.build-and-push.outputs.image-tag }}
      
      - name: Deploy ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
          codedeploy-appspec: appspec.json

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend

  notify:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 💾 Backup Strategy

### Automated RDS Backups
```bash
# Enable automated backups (already done in creation)
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier jobautoflow-db \
  --db-snapshot-identifier jobautoflow-backup-$(date +%Y%m%d)

# Copy to another region for disaster recovery
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier jobautoflow-backup-20240101 \
  --target-db-snapshot-identifier jobautoflow-backup-20240101 \
  --source-region us-east-1 \
  --region us-west-2
```

### S3 Backup Script
Create `scripts/backup.sh`:

```bash
#!/bin/bash
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="jobautoflow-backups"

# Backup database
echo "Backing up database..."
pg_dump "$DATABASE_URL" | gzip > /tmp/db_backup_$DATE.sql.gz
aws s3 cp /tmp/db_backup_$DATE.sql.gz s3://$BACKUP_BUCKET/database/

# Backup Redis (if persistence enabled)
echo "Backing up Redis..."
aws elasticache create-snapshot \
  --cache-cluster-id jobautoflow-redis \
  --snapshot-name redis-backup-$DATE

# Cleanup old backups (keep 30 days)
echo "Cleaning up old backups..."
aws s3 ls s3://$BACKUP_BUCKET/database/ | \
  awk '{print $4}' | \
  while read file; do
    aws s3 rm s3://$BACKUP_BUCKET/database/$file
  done

# Notify
echo "Backup completed: $DATE"
```

---

## ↩️ Rollback Strategy

### Blue-Green Deployment
```bash
# Deploy new version alongside old version
aws ecs update-service \
  --cluster jobautoflow-cluster \
  --service jobautoflow-backend-green \
  --task-definition jobautoflow-backend:v2

# Test green environment
# If tests pass, switch ALB to green
# If tests fail, keep blue running
```

### Quick Rollback
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster jobautoflow-cluster \
  --service jobautoflow-backend \
  --task-definition jobautoflow-backend:$(($(aws ecs describe-services \
    --cluster jobautoflow-cluster \
    --services jobautoflow-backend \
    --query 'services[0].deployments[0].taskDefinition' \
    --output text | grep -o '[0-9]*$') - 1))

# Or rollback specific version
aws ecs update-service \
  --cluster jobautoflow-cluster \
  --service jobautoflow-backend \
  --task-definition jobautoflow-backend:5
```

---

## 📊 Monitoring & Alerting

### CloudWatch Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name jobautoflow-high-cpu \
  --alarm-description "CPU > 80% for 5 minutes" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=jobautoflow-cluster Name=ServiceName,Value=jobautoflow-backend \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:jobautoflow-alerts

# 5xx errors alarm
aws cloudwatch put-metric-alarm \
  --alarm-name jobautoflow-5xx-errors \
  --alarm-description "5xx errors > 10" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/jobautoflow-alb/xxxxx \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:jobautoflow-alerts
```

---

## ✅ Production Checklist

- [ ] VPC with public/private subnets
- [ ] RDS PostgreSQL with backups
- [ ] ElastiCache Redis
- [ ] ECS Fargate cluster
- [ ] Application Load Balancer
- [ ] Auto-scaling configured
- [ ] SSL certificate (ACM)
- [ ] Domain configured
- [ ] Secrets in Secrets Manager
- [ ] CI/CD pipeline
- [ ] Monitoring & alerts
- [ ] Backup strategy
- [ ] Rollback plan
- [ ] Security groups configured
- [ ] IAM roles with least privilege

---

## 💰 Cost Optimization Tips

1. **Use FARGATE_SPOT** for non-critical workloads (70% savings)
2. **Enable RDS Reserved Instances** for long-term databases
3. **Use S3 Intelligent-Tiering** for file storage
4. **Enable CloudFront caching** to reduce ALB costs
5. **Set up billing alerts** at $50, $100, $200

---

**Your enterprise-grade infrastructure is ready!** 🚀
