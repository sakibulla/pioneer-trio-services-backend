# Deploy Pioneer Backend to Render.com

## Prerequisites
- GitHub repository pushed with backend code
- Render.com account (free)
- AWS S3 credentials (for file storage)
- Gmail app password (for email service)

## Step 1: Create Render Account & Connect GitHub

1. Go to https://render.com
2. Sign up or login
3. Click your account avatar → "Account settings"
4. Under "Connected services", connect your GitHub account
5. Grant access to `sakibulla/pioneer-trio` repository

## Step 2: Deploy Backend Service

### Option A: Using render.yaml (Recommended)

1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Select "Public Git repository"
4. Enter: `https://github.com/sakibulla/pioneer-trio`
5. Leave branch as "main" (or specify your branch)
6. Paste the `render.yaml` from this folder OR
   - Render will auto-detect if render.yaml exists in the repo
7. Click "Create Blueprint"
8. Review and confirm
9. Wait for deployment (5-10 minutes)

### Option B: Manual Setup

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect GitHub and select `pioneer-trio`
5. Configure:
   - **Name**: `pioneer-backend`
   - **Environment**: Node
   - **Region**: Ohio (or closest to you)
   - **Branch**: main
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

6. Click "Create Web Service"

## Step 3: Set Environment Variables in Render Dashboard

Once the service is created, go to:
`Settings → Environment` and add these variables:

### Required (set these immediately):

```
JWT_SECRET=your-long-random-secret-key-here
ENCRYPTION_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SMTP_USER=leads@pioneertrioservices.com
SMTP_PASS=your-gmail-app-password
S3_ACCESS_KEY_ID=your-aws-access-key
S3_SECRET_ACCESS_KEY=your-aws-secret-key
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### How to Generate Values:

**JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**ENCRYPTION_MASTER_KEY** (32-byte hex):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**SMTP_PASS** (Gmail):
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate app password
4. Copy and paste

**S3 Credentials**:
1. Go to AWS IAM console
2. Create new user with S3 full access
3. Create access keys
4. Copy ID and Secret

## Step 4: Create PostgreSQL Database

In Render.com:

1. Go to Dashboard → Databases
2. Click "Create +"
3. Select "PostgreSQL"
4. Configure:
   - **Name**: `pioneer-postgres`
   - **Plan**: Free
   - **Region**: Ohio
5. Click "Create"
6. Wait for database to initialize
7. Copy connection string
8. The connection string automatically goes into the `DATABASE_URL` env var

## Step 5: Create Redis Cache

In Render.com:

1. Go to Dashboard → "Redis"
2. Click "Create +"
3. Configure:
   - **Name**: `pioneer-redis`
   - **Plan**: Free
   - **Region**: Ohio
4. Click "Create"
5. Wait for Redis to initialize
6. The connection string automatically goes into the `REDIS_URL` env var

## Step 6: Link Services Together

Once all services are created (Backend, PostgreSQL, Redis):

1. Go to Backend service settings
2. Under "Environment", verify these are populated:
   - `DATABASE_URL` (from PostgreSQL)
   - `REDIS_URL` (from Redis)
3. If not auto-populated, copy from those services and add manually

## Step 7: Verify Deployment

Once all services are deployed:

```bash
# Check if backend is healthy
curl https://your-backend-url/health

# Check readiness (with dependencies)
curl https://your-backend-url/health/ready

# View Swagger docs
https://your-backend-url/api/v1/docs
```

Expected responses:
- `/health` → `{"status": "ok"}`
- `/health/ready` → `{"status": "ready", "checks": {...}}`
- `/api/v1/docs` → Swagger UI

## Step 8: Initialize Database

Run Prisma migrations:

```bash
# SSH into Render backend service or run via console
npm run prisma:migrate:deploy
npm run prisma:seed
```

Or access the backend service shell in Render dashboard:
1. Go to Backend service
2. Click "Shell" tab
3. Run: `npm run prisma:migrate:deploy && npm run prisma:seed`

## Troubleshooting

### Build Fails

Check logs in Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Look for build errors

Common issues:
- Missing environment variables → Add to "Environment" section
- Prisma generation failed → Run `npm run prisma:generate` locally first
- TypeScript errors → Check `npm run build` works locally

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Solution:
1. Verify PostgreSQL service is deployed
2. Check `DATABASE_URL` env var is correct
3. Wait for database to fully initialize (2-3 minutes)

### Redis Connection Error

```
Error: ECONNREFUSED 127.0.0.1:6379
```

Solution:
1. Verify Redis service is deployed
2. Check `REDIS_URL` env var is correct
3. Wait for Redis to fully initialize

### CORS Errors

Frontend can't reach backend? Check:
1. `CORS_ORIGIN` includes frontend domain
2. Frontend uses correct backend URL
3. Backend is actually running (`/health` returns 200)

### Out of Memory

Free tier has 512MB memory. If you exceed:
1. Upgrade to paid plan
2. Optimize code (reduce logging, etc.)
3. Or use separate services for different concerns

## Getting Your Backend URL

Once deployed successfully in Render:

1. Go to your Backend service
2. At the top, you'll see the URL: `https://your-service-name.onrender.com`
3. Use this for frontend: `https://your-service-name.onrender.com/api/v1`

Example: If service URL is `https://pioneer-backend.onrender.com`
Then API URL is: `https://pioneer-backend.onrender.com/api/v1`

## Monitoring & Logs

In Render dashboard:

- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Disk usage
- **Events**: Deployment history
- **Settings → Auto-deploy**: Auto-redeploy when GitHub changes

## Next Steps

1. ✅ Verify backend deployment
2. ✅ Note your backend URL
3. ✅ Update frontend `.env.production` with backend URL
4. ✅ Test API calls from frontend
5. ✅ Monitor logs for errors

---

## Quick Reference

| Component | Status | URL |
|-----------|--------|-----|
| Backend | Deploying | https://pioneer-backend.onrender.com |
| PostgreSQL | Deploying | (internal) |
| Redis | Deploying | (internal) |
| API Docs | Ready | https://pioneer-backend.onrender.com/api/v1/docs |
| Health | Ready | https://pioneer-backend.onrender.com/health |

## Support

- Render Docs: https://render.com/docs
- GitHub Issues: https://github.com/sakibulla/pioneer-trio/issues
- Backend Logs: Render Dashboard → Logs tab
