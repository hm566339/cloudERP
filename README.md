# Cloud ERP - Production Deployment Guide for www.mark2.in

This standalone deployment package (`deploy-project/`) runs Cloud ERP as a sub-application under **`https://www.mark2.in`**:
* **Frontend**: `https://www.mark2.in/erp/`
* **Backend API**: `https://www.mark2.in/api/*`

> **CRITICAL ARCHITECTURAL GUARANTEE**:
> Your existing website running at `https://www.mark2.in/` is **NOT** replaced or broken. CloudERP operates strictly within `/erp/` and `/api/` locations. All other paths on `www.mark2.in` continue to be served by your existing website configuration.

---

## 1. Production Architecture Overview

```text
                  Internet Traffic (HTTPS 443)
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │       Host Nginx (www.mark2.in on VPS)       │
        │                                              │
        │  /           ──► Existing Website (Untouched)│
        │  /erp/       ──► Reverse Proxy (127.0.0.1:3001)
        │  /api/       ──► Reverse Proxy (127.0.0.1:3001)
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │  Cloud ERP Nginx Container (127.0.0.1:3001)  │
        │                                              │
        │  /erp/assets/ ──► Static JS / CSS / Media    │
        │  /erp/        ──► SPA Fallback (/erp/index.html)
        │  /api/        ──► Proxy to Gateway           │
        └──────────────────────┬───────────────────────┘
                               │ (Internal Docker Network: erp-network)
                               ▼
                    ┌──────────────────────┐
                    │ erp-gateway-service  │ (Port 8080)
                    └──────────┬───────────┘
                               │
        ┌───────────────┬──────┴────────┬───────────────┐
        ▼               ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  erp-auth    ││ erp-account  ││ erp-workflow ││erp-inventory │
│ (Port 8090)  ││ (Port 8081)  ││ (Port 8083)  ││ (Port 8082)  │
└───────┬──────┘└───────┬──────┘└───────┬──────┘└───────┬──────┘
        │               │               │               │
        └───────────────┼───────────────┼───────────────┘
                        ▼
            ┌──────────────────────┐
            │   PostgreSQL (db)    │ (Port 5432 - Internal Only)
            └──────────────────────┘
```

### Security & Isolation:
1. **No Backend Public Exposure**: PostgreSQL (`5432`), Gateway (`8080`), Auth (`8090`), Account (`8081`), Workflow (`8083`), and Inventory (`8082`) are **NOT** bound to public host ports.
2. **Local Host Binding**: Frontend Nginx container binds strictly to `127.0.0.1:3001`, accessible only to your host Nginx reverse proxy.
3. **Existing Website Untouched**: Requests to `https://www.mark2.in/` continue to be handled by your existing website configuration.

---

## 2. Host Server Nginx Configuration (`www.mark2.in`)

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

    # (Your existing website "location /" or PHP/Node proxy remains untouched below)
```

Then test and reload your host Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Quick Start: Deployment on Server

### Step 1: Upload `deploy-project` to Server
```bash
scp -r deploy-project user@YOUR_SERVER_IP:/opt/cloudERP
```

### Step 2: Configure Production Environment
```bash
cd /opt/cloudERP
cp .env.example .env
chmod 600 .env
nano .env
```
Ensure the following are set:
* `POSTGRES_PASSWORD`: Your strong database password.
* `JWT_SECRET`: Random 32+ character key.
* `ADMIN_PASSWORD`: Your secure initial admin password.

### Step 3: Launch Services
```bash
chmod +x *.sh
./deploy.sh
```

### Step 4: Verify Deployment Status
```bash
./status.sh
```

---

## 4. Verification Checklist

Test the following endpoints to ensure everything functions properly:

1. **Bare subpath redirect**:
   ```bash
   curl -I https://www.mark2.in/erp
   # Expected: HTTP 301 Moved Permanently -> https://www.mark2.in/erp/
   ```
2. **Frontend UI Loading**:
   ```bash
   curl -I https://www.mark2.in/erp/
   # Expected: HTTP 200 OK
   ```
3. **SPA Deep Route & Browser Refresh (No 404)**:
   ```bash
   curl -I https://www.mark2.in/erp/login
   curl -I https://www.mark2.in/erp/dashboard
   curl -I https://www.mark2.in/erp/accounts
   # Expected: HTTP 200 OK (Served from /erp/index.html)
   ```
4. **Static JS/CSS Assets**:
   ```bash
   curl -I https://www.mark2.in/erp/assets/index.js
   # Expected: HTTP 200 OK with Cache-Control headers
   ```
5. **API Gateway Connectivity (No /api/api duplication)**:
   ```bash
   curl -i https://www.mark2.in/api/sso/auth/login
   # Expected: 200/400/401 HTTP response from Auth Service through Gateway
   ```
6. **Main Website Unaffected**:
   ```bash
   curl -I https://www.mark2.in/
   # Expected: Serves existing main website as before
   ```

---

## 5. Daily Operations

* **Check Status**: `./status.sh`
* **Real-time Logs**: `./logs.sh` (or `./logs.sh auth-service`)
* **Stop Services**: `./stop.sh` (Database data in `db-data` is strictly preserved)
* **Start Services**: `./start.sh`
* **Restart Services**: `./restart.sh`
* **Update Code**: `./update.sh`
* **Rollback**: `./rollback.sh` (Reverts containers without touching database volume)
