# Cloud ERP - Production Deployment & CI/CD Guide for www.mark2.in

This deployment package runs Cloud ERP as a high-performance, containerized microservices suite under **`https://www.mark2.in`**:
* **Frontend Application**: `https://www.mark2.in/erp/`
* **Backend API Gateway**: `https://www.mark2.in/api/*`
* **Existing Website**: `https://www.mark2.in/` (**Untouched**)

> **CRITICAL ARCHITECTURAL GUARANTEE**:
> Your existing website running at `https://www.mark2.in/` is **NEVER** modified or disrupted. CloudERP operates strictly within `/erp/` and `/api/` subpaths. All root traffic continues to be served by your existing website configuration.

---

## 1. Automated CI/CD Architecture Overview

```text
       Developer Push
             │
             ▼ git push origin main
┌──────────────────────────────┐
│        GitHub Actions        │
│   (.github/workflows/        │
│        deploy.yml)           │
└──────────────┬───────────────┘
               │ 1. Build 6 Docker Images in parallel
               │ 2. Tag with :<service>-latest and :<service>-${GITHUB_SHA}
               │ 3. Push to Docker Hub
               ▼
┌──────────────────────────────┐
│          Docker Hub          │
│   (mohit950/clouderp)        │
└──────────────┬───────────────┘
               │ 4. SSH trigger deployment on server
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Production Linux Server                   │
│                       (/opt/cloudERP)                       │
│                                                             │
│  5. git sync compose & scripts                              │
│  6. docker compose pull (prebuilt images from Docker Hub)    │
│  7. docker compose up -d (recreate only modified containers)│
│  8. Persistent database volume 'db-data' preserved          │
│  9. Health checks verify all 7 containers online            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Docker Hub Image Strategy

All microservices are stored in the single repository **`mohit950/clouderp`** using service-specific tags:

| Service | Latest Tag | Immutable Git SHA Tag |
| :--- | :--- | :--- |
| **Frontend UI (Nginx + Vite)** | `mohit950/clouderp:frontend-latest` | `mohit950/clouderp:frontend-${GITHUB_SHA}` |
| **API Gateway** | `mohit950/clouderp:gateway-latest` | `mohit950/clouderp:gateway-${GITHUB_SHA}` |
| **Authentication & SSO** | `mohit950/clouderp:auth-latest` | `mohit950/clouderp:auth-${GITHUB_SHA}` |
| **Account Service** | `mohit950/clouderp:account-latest` | `mohit950/clouderp:account-${GITHUB_SHA}` |
| **Inventory Service** | `mohit950/clouderp:inventory-latest` | `mohit950/clouderp:inventory-${GITHUB_SHA}` |
| **Workflow Service** | `mohit950/clouderp:workflow-latest` | `mohit950/clouderp:workflow-${GITHUB_SHA}` |

* **Immutable Rollbacks**: The Git SHA tag ensures exact reproducibility and instantaneous rollback to any specific build.
* **No Server Compilations**: The production VPS pulls pre-compiled Docker images, saving CPU/memory and avoiding long build delays on the server.

---

## 3. Required GitHub Repository Secrets

In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, and define:

| Secret Name | Value Description | Example |
| :--- | :--- | :--- |
| `DOCKERHUB_USERNAME` | Your Docker Hub account username | `mohit950` |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token (Read/Write) | `dckr_pat_xxxx...` |
| `SERVER_HOST` | Production VPS public IP or hostname | `123.45.67.89` or `mark2.in` |
| `SERVER_USER` | SSH user with Docker permissions | `ubuntu` or `root` |
| `SERVER_SSH_KEY` | Private SSH Key (ed25519 or RSA) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | *(Optional)* SSH Port if not default 22 | `22` |

> **Security Note**: Never commit passwords, tokens, or SSH private keys to Git. The `.gitignore` prevents `.env` and sensitive files from being pushed.

---

## 4. Host Server Nginx Configuration (`www.mark2.in`)

In your host server's Nginx configuration (e.g. `/etc/nginx/sites-available/default` or inside your domain's server block in `/etc/nginx/sites-available/mark2.in`), add the following blocks inside your existing `server { listen 443 ssl ...; server_name www.mark2.in mark2.in; ... }`:

```nginx
    # --------------------------------------------------------------------------
    # Cloud ERP Subpath Integration (https://www.mark2.in/erp/)
    # --------------------------------------------------------------------------
    # 1. Clean redirect for bare /erp
    location = /erp {
        return 301 https://$host/erp/;
    }

    # 2. CloudERP Frontend & Assets (/erp/)
    location /erp/ {
        proxy_pass http://127.0.0.1:3001/erp/;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /erp;

        # Timeouts and buffer sizes
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # 3. CloudERP Backend API Gateway (/api/)
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /api;

        # Timeouts and buffer sizes
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # (Your existing website "location /" remains untouched below)
```

Reload host Nginx after updating:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. First-Time Production Server Setup

Run these commands once on your production Linux server:

```bash
# 1. Connect to VPS
ssh user@YOUR_SERVER_IP

# 2. Clone the repository into /opt/cloudERP
sudo mkdir -p /opt/cloudERP
sudo chown -R $USER:$USER /opt/cloudERP
git clone https://github.com/hm566339/cloudERP.git /opt/cloudERP
cd /opt/cloudERP

# 3. Create production .env file
cp .env.example .env
chmod 600 .env
nano .env
# Set secure values for POSTGRES_PASSWORD, JWT_SECRET, and ADMIN_PASSWORD

# 4. Make scripts executable and trigger initial deployment
chmod +x *.sh
./deploy.sh
```

---

## 6. Daily Operations & Troubleshooting

### How to Check Container Status
```bash
./status.sh
# Or view with docker
docker compose ps
```

### How to Check Logs
```bash
# Tail all logs aggregated:
./logs.sh

# Or inspect an individual microservice:
./logs.sh erp-gateway-service
./logs.sh erp-auth-service
./logs.sh erp-account-service
./logs.sh erp-workflow-service
./logs.sh erp-inventory-service
./logs.sh erp-frontend
./logs.sh erp-db
```

### How to Manually Deploy an Update
```bash
# Deploy latest tagged images:
./deploy.sh

# Or deploy a specific Git commit SHA tag:
./deploy.sh 8a1f4b2
```

### How to Rollback
The rollback procedure safely switches running containers to a previous Docker tag:
```bash
# Automatically rollback to the previous release recorded in .last_release:
./rollback.sh

# Or rollback to a specific Git SHA tag:
./rollback.sh 8a1f4b2
```
> **SAFETY GUARANTEE**: Rollback **never** touches PostgreSQL or the `db-data` volume. Only application containers are recreated.

### How to Safely Stop and Start Services
```bash
./stop.sh       # Gracefully stops containers (db-data volume preserved)
./start.sh      # Starts existing containers
./restart.sh    # Restarts all containers
```

---

## 7. Database Persistence & Safety Guarantees

* PostgreSQL stores all database files in the Docker named volume **`db-data`**.
* The following commands are **STRICTLY FORBIDDEN** in production:
  * `docker compose down -v` *(Deletes database volumes)*
  * `docker volume rm cloudERP_db-data` *(Destroys data)*
  * `DROP DATABASE` *(Destroys data)*
* Our scripts (`deploy.sh`, `rollback.sh`, `stop.sh`, `update.sh`) execute only non-destructive updates (`docker compose up -d`). Database state is permanently preserved across deployments and rollbacks.
