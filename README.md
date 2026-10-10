# Pioneer Trio Services - Production Backend Server

Production-grade, scalable backend REST API server for **Pioneer Trio Services** (Immigration Consultancy & Marriage Consultancy). Built with Node.js 20 LTS, TypeScript, Express, Prisma ORM, PostgreSQL, Redis, Bull Queues, and Docker.

---

## 🚀 Key Features

- **Relational Integrity**: Complete PostgreSQL schema with 20+ models implementing Section 7.2 (Immigration) and Section 8.3 (Matrimonial).
- **Immigration Assessment System**: 8-section intake, document encryption (AES-256-GCM), automatic coordinator workload assignment, four-eyes QC review pipeline, and case notes.
- **Human-Led Marriage Consultancy**: Verified profile intake, strict 2-photo database constraint, Sharp image optimization to WebP, staff-only interview records, and human-led match proposals.
- **Enterprise Security**: JWT access/refresh token rotation, bcrypt hashing (cost 12), 5-failed attempt lockout, Helmet CSP headers, strict CORS origin checks, and multi-tier rate limiting.
- **Background Jobs**: Bull Queues with Redis backend for asynchronous transactional emails, virus scanning, and maintenance cleanup.
- **Observability**: Structured Winston JSON logging with sensitive data masking, Prometheus metrics (`/metrics`), Sentry error tracking, and Bull Board queue dashboard (`/admin/queues`).
- **DevOps Ready**: Docker Compose, Multi-stage production `Dockerfile.prod`, Nginx reverse proxy with SSL, Kubernetes manifests (`k8s/`), and automated backup/restore scripts.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 LTS + TypeScript (Strict Mode)
- **Framework**: Express.js
- **Database**: PostgreSQL 15 via Prisma ORM
- **Cache / Sessions / Queues**: Redis 7 + `ioredis` + `bull`
- **Authentication**: JWT + Refresh Tokens (Whitelisted in Redis)
- **Object Storage**: AWS S3 / MinIO with server-side AES-256-GCM encryption
- **Image Processing**: `sharp` (WebP conversion, thumbnails, resizing)
- **Email**: `nodemailer` with HTML templates
- **Documentation**: Swagger OpenAPI 3.0 (`/api/v1/docs`)
- **Process Manager**: PM2 Cluster Mode (`ecosystem.config.js`)

---

## 📦 Getting Started (Local Development)

### 1. Start Infrastructure with Docker
```bash
docker compose up -d postgres redis minio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client & Run Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development Server with Hot Reload
```bash
npm run dev
```

The API will be accessible at `http://localhost:5000/api/v1`.

---

## 🧪 Testing & Linting

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run linter
npm run lint
```

---

## 📚 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register new user | Public |
| `POST` | `/api/v1/auth/login` | Login and obtain JWT tokens | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public |
| `POST` | `/api/v1/immigration/assessments` | Submit 8-section immigration assessment | Public |
| `GET` | `/api/v1/immigration/cases` | List immigration cases | Coordinator/Admin/Client |
| `POST` | `/api/v1/immigration/cases/:id/documents` | Upload encrypted document | Coordinator/Admin/Client |
| `POST` | `/api/v1/immigration/cases/:id/qc-review` | Submit 4-eyes QC review | Coordinator/Admin |
| `POST` | `/api/v1/matrimonial/profiles` | Submit marriage profile | Public / Client |
| `POST` | `/api/v1/matrimonial/profiles/:id/photos` | Upload photo (max 2) | Client / Staff |
| `POST` | `/api/v1/matchmaker/matches` | Propose human-led match | Matchmaker/Admin |
| `GET` | `/health` | Liveness health check | Public |
| `GET` | `/health/ready` | Readiness check (DB, Redis, S3) | Public |
| `GET` | `/metrics` | Prometheus metrics | Public |
| `GET` | `/api/v1/docs` | Swagger OpenAPI UI | Public |
