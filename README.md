# Pioneer Trio Services - Backend API

A production-grade, scalable REST API backend for **Pioneer Trio Services** (Immigration Consultancy & Marriage Consultancy). Built with Node.js 20 LTS, TypeScript, Express, Prisma ORM, PostgreSQL, Redis, and AWS S3.

**💻 [Frontend](https://www.pioneertrioservices.com)** | **📖 [Documentation](#api-endpoints-overview)**

---

## ✨ Core Features

### 🛡️ Enterprise Security
- **JWT Authentication**: Access/refresh token rotation with Redis whitelist
- **Password Security**: bcrypt hashing (cost 12) + salt rounds
- **Rate Limiting**: Multi-tier protection (general, auth, API)
- **CORS Security**: Strict origin validation, credentials support
- **Helmet.js**: CSP headers, X-Frame-Options, HSTS
- **Data Encryption**: AES-256-GCM for sensitive documents and PII
- **Failed Login Protection**: 5-attempt lockout with exponential backoff

### 📋 Immigration Consultancy System
- **8-Section Assessment Intake**: Comprehensive visa eligibility questionnaire
- **Multi-Country Support**: 10+ destination countries (Canada, UK, Australia, US, EU, Gulf, Malaysia)
- **Document Encryption**: Server-side AES-256-GCM for uploaded documents
- **Coordinator Assignment**: Automated workload distribution with role-based access
- **4-Eyes QC Review**: Dual-coordinator verification pipeline for quality assurance
- **Case Notes & Timeline**: Full audit trail with encrypted notes storage
- **Document Versioning**: Track document changes and updates

### 💍 Marriage Consultancy System
- **Verified Profiles**: Multi-field intake with email verification
- **Photo Management**: Strict 2-photo limit per profile with WebP optimization
- **Staff-Only Interviews**: Interview records accessible only to staff roles
- **Human-Led Matching**: Matchmaker-proposed connections with relationship-intent filtering
- **Safety Screening**: Multi-criteria vetting and background checks
- **Privacy Controls**: User-managed visibility and contact preferences
- **Profile Deactivation**: Soft-delete with data retention for disputes

### 📧 Asynchronous Processing
- **Bull Queues**: Redis-backed job queues for:
  - Transactional emails (assessments, profile confirmations)
  - Document virus scanning
  - Image optimization and resizing
  - Scheduled maintenance tasks
- **Job Retries**: Configurable retry logic with exponential backoff
- **Dead Letter Handling**: Failed jobs captured for manual review
- **Bull Board UI**: Queue monitoring at `/admin/queues`

### 📊 Observability & Monitoring
- **Structured Logging**: Winston JSON logging with sensitive data masking
- **Prometheus Metrics**: Performance and business metrics at `/metrics`
- **Sentry Error Tracking**: Real-time error capture and alerting
- **Request Tracing**: Correlation IDs for request-response tracking
- **Health Checks**: Liveness (`/health`) and readiness (`/health/ready`)
- **Performance Monitoring**: Response time, throughput, error rates

### 🗄️ Data Management
- **PostgreSQL 15**: Relational data with 20+ models
- **Prisma ORM**: Type-safe database queries with migrations
- **Redis Caching**: Session storage, rate limit counters, refresh token whitelist
- **AWS S3 Integration**: Document and photo storage with presigned URLs
- **Backup & Restore**: Automated PostgreSQL backup scripts

### 🚀 DevOps Ready
- **Docker Support**: Multi-stage production Dockerfile
- **Docker Compose**: Local dev environment (postgres, redis, minio)
- **Docker Registry**: Pre-built images on Docker Hub
- **Kubernetes Manifests**: k8s deployments, services, ingress config
- **Environment-Specific Config**: `.env`, `.env.production`
- **PM2 Cluster Mode**: Process manager for production deployments

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript (Strict Mode)
- **Framework**: Express.js 4
- **Database**: PostgreSQL 15 + Prisma ORM 5
- **Cache/Sessions/Queues**: Redis 7 + ioredis + Bull
- **Authentication**: JWT + Refresh Tokens
- **Object Storage**: AWS S3 / MinIO
- **Image Processing**: Sharp (WebP, optimization, thumbnails)
- **Email**: Nodemailer with HTML templates
- **Documentation**: Swagger OpenAPI 3.0
- **Testing**: Jest + Supertest
- **Process Manager**: PM2
- **Error Tracking**: Sentry
- **Validation**: Zod schemas
- **Logging**: Winston with daily rotation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS+
- npm/yarn
- Docker & Docker Compose (for local infrastructure)
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)
- AWS S3 bucket or MinIO (or use Docker)

### 1. Start Infrastructure with Docker

```bash
# Start PostgreSQL, Redis, and MinIO (S3-compatible)
docker compose up -d postgres redis minio

# Wait 10-15 seconds for services to initialize
```

### 2. Clone & Install

```bash
git clone <repository>
cd pioneer-trio-services-backend
npm install
```

### 3. Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings:
# - DATABASE_URL (postgresql://user:pass@localhost:5432/pioneer)
# - REDIS_URL (redis://localhost:6379)
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - ENCRYPTION_MASTER_KEY (generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
# - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (or MinIO credentials)
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed sample data (optional)
npm run prisma:seed
```

### 5. Start Development Server

```bash
# Start with hot reload via tsx
npm run dev

# API available at http://localhost:5000/api/v1
# Swagger docs at http://localhost:5000/api/v1/docs
```

---

## 📦 Project Structure

```
src/
├── config/                      # Environment and app configuration
│   ├── env.ts                  # Environment variable validation (Zod)
│   ├── database.ts             # Database connection setup
│   ├── redis.ts                # Redis client initialization
│   ├── s3.ts                   # AWS S3 client setup
│   └── sentry.ts               # Sentry error tracking
│
├── middleware/                  # Express middleware
│   ├── auth.ts                 # JWT verification, role checks
│   ├── errorHandler.ts         # Global error handling
│   ├── requestLogger.ts        # Winston logging
│   ├── rateLimiter.ts          # Multi-tier rate limiting
│   ├── cors.ts                 # CORS configuration
│   └── validation.ts           # Request validation
│
├── controllers/                 # Route handlers
│   ├── authController.ts       # Login, register, refresh tokens
│   ├── immigrationController.ts # Assessment, cases, QC review
│   ├── matrimonialController.ts # Profiles, photos, matches
│   ├── leadController.ts       # Contact forms, inquiries
│   ├── adminController.ts      # Admin dashboard, user management
│   └── healthController.ts     # Health & readiness checks
│
├── services/                    # Business logic
│   ├── authService.ts          # JWT, password hashing, verification
│   ├── immigrationService.ts   # Assessment processing, case management
│   ├── matrimonialService.ts   # Profile management, matching
│   ├── emailService.ts         # Email sending via Nodemailer
│   ├── s3Service.ts            # File upload/download, encryption
│   ├── imageService.ts         # Image optimization via Sharp
│   ├── encryptionService.ts    # AES-256-GCM encryption/decryption
│   └── auditService.ts         # Audit logging
│
├── routes/                      # Express route definitions
│   ├── authRoutes.ts           # /api/v1/auth/*
│   ├── immigrationRoutes.ts    # /api/v1/immigration/*
│   ├── matrimonialRoutes.ts    # /api/v1/matrimonial/*
│   ├── leadRoutes.ts           # /api/v1/lead/*
│   ├── adminRoutes.ts          # /api/v1/admin/*
│   └── healthRoutes.ts         # /health, /health/ready
│
├── schemas/                     # Zod validation schemas
│   ├── authSchemas.ts          # Login, register, token refresh
│   ├── immigrationSchemas.ts   # Assessment, case, document
│   ├── matrimonialSchemas.ts   # Profile, photo, match
│   └── commonSchemas.ts        # Pagination, sorting, etc.
│
├── jobs/                        # Bull queue jobs
│   ├── emailQueue.ts           # Transactional email jobs
│   ├── imageOptimizationQueue.ts # Image processing jobs
│   ├── maintenanceQueue.ts     # Cleanup and maintenance
│   └── queueSetup.ts           # Queue initialization
│
├── utils/                       # Utility functions
│   ├── logger.ts               # Winston logger setup
│   ├── errorHandler.ts         # Custom error classes
│   ├── validators.ts           # Helper validation functions
│   ├── formatters.ts           # Data transformation helpers
│   └── constants.ts            # App-wide constants
│
├── types/                       # TypeScript type definitions
│   ├── auth.ts                 # Auth-related types
│   ├── api.ts                  # API request/response types
│   ├── database.ts             # Database-related types
│   └── index.ts                # Type exports
│
├── prisma/                      # Database ORM (folder shared in parent)
│   ├── schema.prisma           # Data model definitions
│   └── seed.ts                 # Database seeding
│
├── tests/                       # Test suite
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test data
│
└── index.ts                     # Application entry point
```

---

## 📚 API Endpoints Overview

### Authentication Endpoints
```
POST   /api/v1/auth/register              # Register new user
POST   /api/v1/auth/login                 # Login (returns JWT + refresh token)
POST   /api/v1/auth/refresh               # Refresh access token
POST   /api/v1/auth/logout                # Logout (invalidate tokens)
GET    /api/v1/auth/me                    # Get current user profile
```

### Immigration Endpoints
```
POST   /api/v1/immigration/assessment              # Submit 8-section intake
GET    /api/v1/immigration/cases                   # List cases (paginated)
GET    /api/v1/immigration/cases/:id               # Get case details
POST   /api/v1/immigration/cases/:id/documents    # Upload encrypted document
GET    /api/v1/immigration/cases/:id/documents    # List case documents
GET    /api/v1/immigration/cases/:id/documents/:docId  # Download document
POST   /api/v1/immigration/cases/:id/qc-review    # Submit 4-eyes QC review
GET    /api/v1/immigration/cases/:id/notes        # Get case notes
POST   /api/v1/immigration/cases/:id/notes        # Add case note
```

### Marriage/Matrimonial Endpoints
```
POST   /api/v1/matrimonial/profiles                 # Create profile
GET    /api/v1/matrimonial/profiles/:id             # Get profile details
PUT    /api/v1/matrimonial/profiles/:id             # Update profile
POST   /api/v1/matrimonial/profiles/:id/photos     # Upload profile photo (max 2)
GET    /api/v1/matrimonial/profiles/:id/photos     # Get profile photos
DELETE /api/v1/matrimonial/profiles/:id/photos/:photoId  # Delete photo
POST   /api/v1/matrimonial/matches                  # Create match proposal (admin)
GET    /api/v1/matrimonial/matches/:id              # Get match details
POST   /api/v1/matrimonial/matches/:id/respond     # Respond to match
```

### Lead/Contact Endpoints
```
POST   /api/v1/lead              # Submit contact form inquiry
GET    /api/v1/lead              # List leads (admin only)
GET    /api/v1/lead/:id          # Get lead details (admin only)
```

### Admin Endpoints
```
GET    /api/v1/admin/dashboard              # Dashboard metrics
GET    /api/v1/admin/users                  # List all users
PUT    /api/v1/admin/users/:id/role         # Update user role
DELETE /api/v1/admin/users/:id              # Delete user (soft)
GET    /api/v1/admin/audit-logs             # View audit trail
GET    /api/v1/admin/metrics                # Performance metrics
```

### System Endpoints
```
GET    /health                    # Liveness check
GET    /health/ready              # Readiness check (DB, Redis, S3)
GET    /metrics                   # Prometheus metrics
GET    /api/v1/docs              # Swagger OpenAPI UI
GET    /admin/queues             # Bull Board queue dashboard
```

---

## 🔐 Authentication & Authorization

### JWT Tokens
- **Access Token**: Short-lived (15 min), used for API requests
- **Refresh Token**: Long-lived (7 days), stored in Redis, used to get new access tokens
- **Refresh Token Whitelist**: Redis-backed for token revocation on logout

### User Roles
1. **Client**: End users (case applicants, profile seekers)
2. **Coordinator**: Immigration case handlers (can view/edit assigned cases)
3. **Matchmaker**: Marriage consultancy staff (propose matches, manage profiles)
4. **Admin**: Full system access (user management, metrics, configuration)

### Protected Routes
- All endpoints except `/auth/register`, `/auth/login`, `/auth/refresh`, `/lead` require valid JWT
- Role-based access control enforced via middleware
- Coordinator can only access assigned cases; Admin bypasses restrictions

---

## 🔌 Integration Examples

### Submit Immigration Assessment
```bash
curl -X POST https://pioneer-backend-5qhe.onrender.com/api/v1/immigration/assessment \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmed Khan",
    "email": "ahmed@example.com",
    "destinationCountry": "Canada",
    "educationLevel": "Bachelors",
    "workExperience": 5,
    "ieltsScore": 7.0
  }'
```

### Create Marriage Profile
```bash
curl -X POST https://pioneer-backend-5qhe.onrender.com/api/v1/matrimonial/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Farhana Ahmed",
    "email": "farhana@example.com",
    "age": 26,
    "education": "Masters",
    "profession": "Software Engineer",
    "location": "Dubai",
    "verificationStatus": "pending"
  }'
```

### Upload Case Document
```bash
curl -X POST https://pioneer-backend-5qhe.onrender.com/api/v1/immigration/cases/case_123/documents \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@passport.pdf" \
  -F "documentType=passport"
```

---

## 🗄️ Database Schema

### Core Tables (20+ models)
- **Users**: Client, coordinator, matchmaker, admin accounts
- **ImmigrationAssessments**: 8-section intake responses
- **ImmigrationCases**: Case records linked to assessments
- **ImmigrationDocuments**: Encrypted document storage with versioning
- **CaseCoordinators**: Assignment tracking for workload distribution
- **QCReviews**: 4-eyes review pipeline for quality assurance
- **CaseNotes**: Audit trail with encrypted sensitive data
- **MatrialProfiles**: Marriage consultancy profile records
- **ProfilePhotos**: Photo metadata (max 2 per profile)
- **Matches**: Matchmaker-proposed connections
- **Leads**: Contact form submissions
- **AuditLogs**: Full system audit trail
- **Sessions**: Active session tracking
- **RefreshTokens**: Whitelist for token revocation

See `prisma/schema.prisma` for full schema definitions.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Watch mode for development
npm test -- --watch
```

**Test Files**:
- `tests/unit/` - Unit tests for services, utils, validators
- `tests/integration/` - API endpoint tests with real DB
- `tests/fixtures/` - Mock data and test helpers

---

## 🚀 Deployment

### Deploy to Render

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New +** → **Web Service**
   - Connect GitHub repo and select project folder

3. **Configure Service**
   - **Name**: `pioneer-backend`
   - **Environment**: Node
   - **Plan**: Free or Paid (starter)
   - **Region**: Ohio (default)
   - **Branch**: main
   - **Build Command**: `npm ci --include=dev && npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables** (in Render Dashboard)
   ```
   NODE_ENV=production
   DATABASE_URL=<your-postgresql-url>
   REDIS_URL=<your-redis-url>
   JWT_SECRET=<generated-secret>
   ENCRYPTION_MASTER_KEY=<generated-key>
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=<your-key>
   AWS_SECRET_ACCESS_KEY=<your-secret>
   SMTP_USER=<gmail-address>
   SMTP_PASS=<gmail-app-password>
   SMTP_FROM=noreply@pioneertrioservices.com
   LEAD_EMAIL_TO=info@pioneertrioservices.com
   SENTRY_DSN=<your-sentry-dsn>
   ```

5. **Deploy**
   - Click **Create Web Service**
   - Render builds, migrates DB, and deploys (5-10 min)
   - Access API at assigned URL: `https://pioneer-backend-XXXX.onrender.com`

### Docker Deployment

```bash
# Build Docker image
docker build -f docker/Dockerfile.prod -t pioneer-backend:latest .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  pioneer-backend:latest
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check rollout status
kubectl rollout status deployment/pioneer-backend -n pioneer
```

---

## 📊 Monitoring & Observability

### Prometheus Metrics
Access at `GET /metrics` for:
- HTTP request duration and count
- Database connection pool stats
- Redis connection stats
- Job queue depth and processing time

### Sentry Error Tracking
- Real-time error alerts
- Stack traces and breadcrumbs
- Release tracking

### Health Checks
```bash
# Liveness
curl https://pioneer-backend-5qhe.onrender.com/health

# Readiness (checks DB, Redis, S3)
curl https://pioneer-backend-5qhe.onrender.com/health/ready
```

### Winston Logs
- Daily rotation in `logs/` directory
- JSON format for easy parsing
- Sensitive data masking (tokens, passwords, PII)
- Log levels: debug, info, warn, error

---

## 📧 Email Configuration

### Gmail SMTP Setup
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Set `SMTP_USER` and `SMTP_PASS` in environment

### Email Templates
Transactional emails sent via Bull queues:
- Assessment received confirmation
- Profile creation confirmation
- Match proposal notification
- Case status updates

---

## 🔐 Security Best Practices

- ✅ JWT tokens with expiration
- ✅ Bcrypt password hashing (cost 12)
- ✅ AES-256-GCM document encryption
- ✅ Rate limiting (general, auth, API)
- ✅ CORS with strict origin validation
- ✅ Helmet.js headers (CSP, X-Frame-Options, HSTS)
- ✅ SQL injection prevention via Prisma
- ✅ XSS protection (Content-Type headers)
- ✅ CSRF tokens for state-changing requests (if needed)
- ✅ Environment variable validation (Zod)
- ✅ Audit logging for sensitive operations
- ✅ Sensitive data masking in logs

---

## 🔗 Links & Resources

| Resource | URL |
|----------|-----|
| **Render Dashboard** | https://dashboard.render.com |
| **Frontend** | https://www.pioneertrioservices.com |
| **Documentation** | See API Endpoints & Configuration sections |

---

## 🐛 Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check PostgreSQL is running: `docker ps | grep postgres`
- Ensure password contains no special characters (or is URL-encoded)

### Redis Connection Failed
- Verify `REDIS_URL`: `redis://localhost:6379`
- Check Redis is running: `docker ps | grep redis`

### S3/MinIO Issues
- Verify AWS credentials or MinIO endpoint
- Check bucket exists and has correct permissions
- Test with: `aws s3 ls s3://your-bucket --profile default`

### Build Fails: "npm: command not found"
- Ensure Node.js 20+ is installed: `node --version`
- Clear cache: `npm cache clean --force && npm install`

### API Returns 503 Service Unavailable
- Check database connection: `npm run check-db`
- Verify Redis is running
- Check logs: `tail -f logs/combined.log`

### Tests Fail
- Ensure test database exists
- Run migrations: `npm run prisma:migrate`
- Clear test cache: `npm test -- --clearCache`

---

## 📝 Configuration Files

- **`.env`** - Local development environment
- **`.env.production`** - Production environment (used on Render)
- **`prisma/schema.prisma`** - Database schema and models
- **`jest.config.ts`** - Test runner configuration
- **`tsconfig.json`** - TypeScript compiler options
- **`package.json`** - Dependencies and scripts
- **`docker-compose.yml`** - Local dev infrastructure
- **`docker/Dockerfile.prod`** - Production Docker image
- **`k8s/*.yaml`** - Kubernetes manifests

---

## 📄 License

ISC

---

## 🤝 Support & Contributing

- **Issues**: Report bugs via GitHub Issues
- **Questions**: Contact `info@pioneertrioservices.com`
- **Frontend Issues**: See frontend README at `pioneer-trio-services/README.md`

### Contributing
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with tests
3. Run linter: `npm run lint:fix`
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

---

**Last Updated**: October 2026  
**Status**: 🟢 Production Live  
**Version**: 1.0.0  
