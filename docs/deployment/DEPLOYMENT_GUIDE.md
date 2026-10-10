# Pioneer Trio Services - Production Hosting & Deployment Guide

This document provides complete instructions for deploying, scaling, and maintaining the Pioneer Trio backend infrastructure in production environments.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |   Cloudflare / DNS & DDoS   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Nginx Reverse Proxy / SSL |
                      |    (Rate Limit & Gzip)      |
                      +--------------+--------------+
                                     |
                +--------------------+--------------------+
                |                                         |
                v                                         v
+-------------------------------+         +-------------------------------+
|  Node.js API Instance #1      |         |  Node.js API Instance #2      |
|  (Express + TypeScript)       |         |  (Express + TypeScript)       |
+---------------+---------------+         +---------------+---------------+
                |                                         |
                +--------------------+--------------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
+-------------------+      +-------------------+      +-------------------+
|  PostgreSQL 15    |      |  Redis 7 Cluster  |      | AWS S3 / MinIO    |
|  (Connection Pool)|      |  (Cache & Queues) |      | (Encrypted Files) |
+-------------------+      +-------------------+      +-------------------+
```

---

## 2. Server Prerequisites (VPS / Cloud VM)

- **OS**: Ubuntu 22.04 LTS or Debian 12
- **Hardware Minimum**: 2 vCPU, 4GB RAM, 50GB NVMe SSD
- **Hardware Recommended**: 4 vCPU, 8GB RAM, 100GB NVMe SSD
- **Installed Software**: Docker Engine 24+, Docker Compose v2, Git

---

## 3. Production Deployment with Docker Compose

### Step 1: Clone Repository and Configure Environment
```bash
git clone https://github.com/pioneertrio/pioneer-backend.git /app/pioneer-backend
cd /app/pioneer-backend
cp .env.example .env.production
```

Generate secure production keys and update `.env.production`:
```bash
# Generate 64-character hexadecimal key for AES-256-GCM file encryption:
openssl rand -hex 32

# Generate secure random secret for JWT signing:
openssl rand -base64 48
```

### Step 2: SSL/TLS Certificate Provisioning (Let's Encrypt Certbot)
```bash
mkdir -p docker/ssl
sudo apt install certbot -y
sudo certbot certonly --standalone -d api.pioneertrioservices.com
sudo cp /etc/letsencrypt/live/api.pioneertrioservices.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/api.pioneertrioservices.com/privkey.pem docker/ssl/
```

### Step 3: Launch Containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Run Prisma Database Migrations & Seed
```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## 4. Kubernetes Deployment

Apply manifests in sequence:
```bash
kubectl create namespace pioneer-trio

# 1. Secrets & Config
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 2. Deployment & Service
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 3. Ingress & Auto-scaling
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

Verify rollout:
```bash
kubectl rollout status deployment/pioneer-backend-deployment -n pioneer-trio
```

---

## 5. Automated Backups & Disaster Recovery

Setup a daily cron job on the host machine:
```bash
sudo crontab -e
```
Add the following entry to trigger daily backups at 02:00 AM UTC:
```cron
0 2 * * * /app/pioneer-backend/scripts/backup.sh >> /var/log/pioneer_backup.log 2>&1
```

To restore from a backup file:
```bash
./scripts/restore.sh /var/backups/pioneer/pioneer_db_20260930_020000.sql.gz
```

---

## 6. Observability & Health Probes

- **Liveness Probe**: `GET /health` (Status 200)
- **Readiness Probe**: `GET /health/ready` (Verifies DB, Redis, and Object Storage)
- **Prometheus Metrics**: `GET /metrics` (Scraped by Prometheus server every 15s)
- **Bull Queue Monitoring**: `GET /admin/queues`
- **Swagger Documentation**: `GET /api/v1/docs`
