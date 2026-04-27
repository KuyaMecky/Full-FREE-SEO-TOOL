# VPS Deployment Guide for SEO Audit Pro + n8n

Complete step-by-step guide to deploy SEO Audit Pro with embedded n8n on a VPS.

## Prerequisites

Before starting, you'll need:

### 1. VPS Provider
Choose one:
- **DigitalOcean** - $6/month (recommended, easiest)
- **AWS EC2** - Pay as you go
- **Linode** - Similar to DigitalOcean
- **Hetzner** - Budget option
- **Contabo** - Good performance/price

Minimum specs:
- **2 vCPU**
- **4GB RAM** (8GB+ for production)
- **50GB SSD** (for database + workflows)
- **Ubuntu 20.04 LTS or 22.04 LTS**

### 2. Domain Name
- Point DNS to VPS IP
- Set up SSL certificate (Let's Encrypt, automatic)

### 3. Database (Optional but Recommended)
- PostgreSQL for n8n (instead of SQLite)
- Can be on same VPS or managed service

---

## Step 1: Create VPS

### DigitalOcean (Example)
1. Sign up at https://digitalocean.com
2. Click "Create" → "Droplets"
3. Choose:
   - **OS**: Ubuntu 22.04 LTS
   - **Size**: 2GB/2vCPU ($12/month)
   - **Datacenter**: Closest to you
   - **Auth**: SSH key (recommended)
4. Create droplet
5. Note the IP address (e.g., `123.45.67.89`)

### AWS EC2 (Alternative)
1. Sign up at https://aws.amazon.com
2. Launch EC2 instance (t3.small)
3. Choose Ubuntu 22.04 LTS AMI
4. Configure security groups (allow ports 22, 80, 443)
5. Note the IP address

---

## Step 2: Initial Server Setup

### SSH into Server
```bash
ssh root@your_vps_ip
# Or if using key:
ssh -i /path/to/key.pem ubuntu@your_vps_ip
```

### Update System
```bash
apt update
apt upgrade -y
apt install -y curl wget git build-essential
```

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs npm
node -v  # Should be v20+
npm -v   # Should be v10+
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
pm2 startup
pm2 save
```

### Install PostgreSQL (Optional but Recommended)
```bash
apt install -y postgresql postgresql-contrib

# Login to PostgreSQL
sudo -u postgres psql

# Create n8n database
CREATE DATABASE n8n;
CREATE USER n8n WITH PASSWORD 'strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n;
\q

# Test connection
psql -h localhost -U n8n -d n8n -W
```

### Install Nginx (Reverse Proxy)
```bash
apt install -y nginx

# Enable and start
systemctl enable nginx
systemctl start nginx
```

### Install Certbot (SSL Certificates)
```bash
apt install -y certbot python3-certbot-nginx

# Get certificate (will auto-configure nginx)
certbot certonly --nginx -d yourdomain.com
# Enter email, agree to terms
```

---

## Step 3: Clone & Setup App

### Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/yourusername/seo-audit-app.git
cd seo-audit-app
```

### Install Dependencies
```bash
npm install
```

### Setup Environment Variables
```bash
cp .env.example .env.production
nano .env.production
```

Edit `.env.production`:
```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:password@localhost:5432/seo_audit

# n8n
N8N_URL=http://localhost:5678
N8N_PORT=5678
N8N_HOST=0.0.0.0
N8N_ENCRYPTION_KEY=your-secure-random-key-here
N8N_DB_TYPE=postgresdb
N8N_DB_POSTGRESDB_CONNECTION_STRING=postgresql://n8n:password@localhost:5432/n8n

# Other required vars
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-secret
# ... add all other required env vars
```

### Create Databases
```bash
# Create main app database
sudo -u postgres psql << EOF
CREATE DATABASE seo_audit;
CREATE USER seo_user WITH PASSWORD 'another-strong-password';
GRANT ALL PRIVILEGES ON DATABASE seo_audit TO seo_user;
EOF
```

### Build App
```bash
npm run build
```

---

## Step 4: Setup Systemd Services

### App Service
Create `/etc/systemd/system/seo-audit.service`:
```bash
sudo nano /etc/systemd/system/seo-audit.service
```

Paste:
```ini
[Unit]
Description=SEO Audit Pro
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/seo-audit-app
Environment="NODE_ENV=production"
EnvironmentFile=/home/ubuntu/seo-audit-app/.env.production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### n8n Service
Create `/etc/systemd/system/n8n.service`:
```bash
sudo nano /etc/systemd/system/n8n.service
```

Paste:
```ini
[Unit]
Description=n8n Automation
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/seo-audit-app
Environment="NODE_ENV=production"
EnvironmentFile=/home/ubuntu/seo-audit-app/.env.production
ExecStart=/usr/bin/npx n8n start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable seo-audit.service
sudo systemctl enable n8n.service
sudo systemctl start seo-audit.service
sudo systemctl start n8n.service

# Check status
sudo systemctl status seo-audit.service
sudo systemctl status n8n.service
```

---

## Step 5: Setup Nginx Reverse Proxy

Edit `/etc/nginx/sites-available/default`:
```bash
sudo nano /etc/nginx/sites-available/default
```

Replace with:
```nginx
# Main app
upstream seo_audit {
    server 127.0.0.1:3000;
}

# n8n
upstream n8n {
    server 127.0.0.1:5678;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Main app
    location / {
        proxy_pass http://seo_audit;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # n8n
    location /n8n/ {
        proxy_pass http://n8n/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # n8n websockets
    location /n8n/socket.io {
        proxy_pass http://n8n/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Test & Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Run Databases Migrations

```bash
cd /home/ubuntu/seo-audit-app

# Run Prisma migrations
npx prisma migrate deploy

# Or if using new database:
npx prisma db push
```

---

## Step 7: Verify Everything Works

### Check Services
```bash
sudo systemctl status seo-audit.service
sudo systemctl status n8n.service
```

### Test App
```bash
curl https://yourdomain.com
# Should return HTML
```

### Test n8n
```bash
curl http://localhost:5678/api/health
# Should return {"status":"ok"}
```

### Check Logs
```bash
# App logs
sudo journalctl -u seo-audit.service -f

# n8n logs
sudo journalctl -u n8n.service -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Step 8: Setup Monitoring & Backups

### Monitor Services (Optional)
```bash
# Monitor with PM2 (alternative to systemd)
pm2 start "npm start" --name "seo-audit"
pm2 start "npx n8n start" --name "n8n"
pm2 monit  # View CPU/Memory
pm2 logs   # View logs
```

### Backup Database
```bash
# Create backup script
sudo nano /home/ubuntu/backup-db.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup main app DB
pg_dump -h localhost -U seo_user -d seo_audit > $BACKUP_DIR/seo_audit_$DATE.sql

# Backup n8n DB
pg_dump -h localhost -U n8n -d n8n > $BACKUP_DIR/n8n_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
sudo chmod +x /home/ubuntu/backup-db.sh
```

Add to cron (daily at 2 AM):
```bash
sudo crontab -e
# Add line:
0 2 * * * /home/ubuntu/backup-db.sh
```

---

## Step 9: Maintenance Commands

### View Service Status
```bash
sudo systemctl status seo-audit.service
sudo systemctl status n8n.service
```

### Restart Services
```bash
sudo systemctl restart seo-audit.service
sudo systemctl restart n8n.service
```

### View Real-Time Logs
```bash
sudo journalctl -u seo-audit.service -f
sudo journalctl -u n8n.service -f
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

### Update SSL Certificate (Auto)
```bash
sudo certbot renew
```

---

## Step 10: Deploy Updates

### Pull Latest Code
```bash
cd /home/ubuntu/seo-audit-app
git pull origin main
npm install
npm run build
sudo systemctl restart seo-audit.service
```

### Update n8n
```bash
npm update n8n
sudo systemctl restart n8n.service
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
sudo journalctl -u seo-audit.service -n 50

# Check for port conflicts
sudo lsof -i :3000
sudo lsof -i :5678

# Manual test
cd /home/ubuntu/seo-audit-app
npm start
```

### Database Connection Error
```bash
# Test PostgreSQL connection
psql -h localhost -U seo_user -d seo_audit

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal
```

### High Memory Usage
```bash
# Check what's using memory
top

# Restart services
sudo systemctl restart seo-audit.service
sudo systemctl restart n8n.service

# Increase Node memory
export NODE_OPTIONS=--max-old-space-size=4096
sudo systemctl restart n8n.service
```

### n8n Workflows Not Triggering
```bash
# Check n8n is running
curl http://localhost:5678/api/health

# Check logs
sudo journalctl -u n8n.service -f

# Restart n8n
sudo systemctl restart n8n.service
```

---

## Performance Tuning

### n8n Execution Settings
```env
# In .env.production
N8N_EXECUTIONS_MAX_RETURNED=5          # Limit history (less memory)
N8N_EXECUTIONS_TIMEOUT=300              # 5 min timeout
N8N_EXECUTIONS_DATA_PRUNE_TIMEOUT=2592000  # Auto-delete after 30 days
N8N_GENERIC_POLLING_TRIGGER_INTERVAL=5
```

### Nginx Caching
Add to nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=seo_cache:10m max_size=1g inactive=60m;

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_cache seo_cache;
    proxy_cache_valid 200 60m;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_findings_audit_id ON findings(audit_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
```

---

## Security Checklist

- [ ] SSH keys configured (not password auth)
- [ ] Firewall enabled (`ufw enable`)
- [ ] Only ports 22, 80, 443 open
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] Database password strong
- [ ] N8N_ENCRYPTION_KEY set to random value
- [ ] Environment variables not committed to git
- [ ] Regular backups enabled
- [ ] Fail2ban installed for brute force protection
- [ ] Automatic updates enabled

---

## One-Click Deploy Script (Optional)

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "Deploying SEO Audit Pro + n8n..."

cd /home/ubuntu/seo-audit-app

# Pull latest
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Restart services
sudo systemctl restart seo-audit.service
sudo systemctl restart n8n.service

echo "✅ Deployment complete!"
sudo systemctl status seo-audit.service
sudo systemctl status n8n.service
```

Make executable:
```bash
chmod +x deploy.sh
```

Deploy:
```bash
./deploy.sh
```

---

## Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| VPS (DigitalOcean) | $12/month | 2GB RAM, 2vCPU |
| Domain | $10-15/year | GoDaddy, Namecheap |
| SSL Certificate | FREE | Let's Encrypt |
| PostgreSQL | FREE | On VPS |
| Backups | FREE | Manual/cron |
| **TOTAL** | **~$13/month** | Plus domain |

---

## Next Steps When Ready

1. Choose VPS provider
2. Create droplet/instance
3. Follow steps 1-10 above
4. Access app at `https://yourdomain.com`
5. Go to `/automation` to use n8n
6. Create workflows triggered by audits

---

**Everything is configured and ready!**
When you're ready to deploy, just follow this guide step-by-step.
