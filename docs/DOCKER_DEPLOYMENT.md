# Docker Deployment for SEO Audit Pro + n8n

Deploy everything with Docker Compose - simplest option for VPS.

## Prerequisites

- VPS with Ubuntu 20.04+ (2GB RAM minimum)
- Domain name
- SSH access to VPS
- Docker & Docker Compose installed

## Quick Install (Recommended)

### 1. SSH into VPS
```bash
ssh root@your_vps_ip
```

### 2. Install Docker & Docker Compose
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Verify
docker --version
docker-compose --version
```

### 3. Clone Repository
```bash
cd /root
git clone https://github.com/yourusername/seo-audit-app.git
cd seo-audit-app
```

### 4. Setup Environment
```bash
# Copy example env
cp .env.example .env

# Edit for production
nano .env
```

Edit `.env`:
```env
# Database
DB_USER=postgres
DB_PASSWORD=your-strong-password-here
N8N_DB_USER=n8n
N8N_DB_PASSWORD=another-strong-password

# App
APP_URL=https://yourdomain.com
NODE_ENV=production

# n8n
N8N_ENCRYPTION_KEY=generate-with-openssl-rand-base64-32

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Other required vars
DATABASE_URL=postgresql://postgres:your-password@postgres:5432/seo_audit

# Add all other required environment variables
```

### 5. Create Init Database Script
```bash
cat > init-db.sql << 'EOF'
-- Create databases
CREATE DATABASE seo_audit;
CREATE DATABASE n8n;

-- Create users
CREATE USER n8n WITH PASSWORD 'your-n8n-password';
GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n;
GRANT ALL PRIVILEGES ON SCHEMA public IN DATABASE n8n TO n8n;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n8n;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n8n;
EOF
```

### 6. Update Nginx Config
```bash
# Replace yourdomain.com with your actual domain
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx.conf
```

### 7. Setup SSL Certificate
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate (before starting Docker)
certbot certonly --standalone -d yourdomain.com

# Follow prompts and provide email
```

### 8. Start Services
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
NAME                 STATUS
seo-audit-postgres   Up (healthy)
seo-audit-n8n        Up (healthy)
seo-audit-app        Up (healthy)
seo-audit-nginx      Up
```

### 9. Verify Installation
```bash
# Check app is running
curl https://yourdomain.com

# Check n8n is running
curl http://localhost:5678/api/health
```

### 10. Access Your App
- **Main App**: https://yourdomain.com
- **Automation**: https://yourdomain.com/automation
- **n8n Direct** (not recommended): http://yourdomain.com:5678

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f n8n
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Restart Specific Service
```bash
docker-compose restart app
docker-compose restart n8n
```

### Run Commands Inside Container
```bash
# Prisma migrations
docker-compose exec app npx prisma migrate deploy

# Database access
docker-compose exec postgres psql -U postgres -d seo_audit
```

### Check Service Status
```bash
docker-compose ps
docker-compose health
```

---

## Backup & Restore

### Backup Database
```bash
# Create backups directory
mkdir -p /root/backups

# Backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup both databases
docker-compose exec -T postgres pg_dump -U postgres seo_audit > $BACKUP_DIR/seo_audit_$DATE.sql
docker-compose exec -T postgres pg_dump -U n8n -d n8n > $BACKUP_DIR/n8n_$DATE.sql

# Keep only 30 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup.sh
```

Run backup:
```bash
/root/backup.sh
```

Automate daily backup (cron):
```bash
crontab -e
# Add line:
0 2 * * * /root/backup.sh
```

### Restore Database
```bash
# Restore app database
docker-compose exec -T postgres psql -U postgres seo_audit < /root/backups/seo_audit_YYYYMMDD_HHMMSS.sql

# Restore n8n database
docker-compose exec -T postgres psql -U n8n -d n8n < /root/backups/n8n_YYYYMMDD_HHMMSS.sql
```

---

## Updates & Deployment

### Pull Latest Code
```bash
cd /root/seo-audit-app
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d
```

### Run Migrations
```bash
docker-compose exec app npx prisma migrate deploy
```

### Restart Single Service
```bash
docker-compose restart app
```

---

## Monitoring & Health

### Check Container Resources
```bash
docker stats
```

### View Real-Time Logs
```bash
docker-compose logs -f app
docker-compose logs -f n8n
```

### Health Check Endpoint
```bash
# App
curl https://yourdomain.com

# n8n
curl http://localhost:5678/api/health
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port
lsof -i :3000
lsof -i :5678

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### App Crashes on Startup
```bash
# View logs
docker-compose logs app

# Rebuild image
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### n8n Not Accessible
```bash
# Check n8n is running
docker-compose logs n8n

# Check port mapping
docker-compose ps

# Restart n8n
docker-compose restart n8n
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Remove unused Docker images
docker image prune -a

# Remove stopped containers
docker container prune

# Check volumes size
du -sh /var/lib/docker/volumes/*
```

### Out of Memory
```bash
# Check memory usage
free -h

# Increase swap (temporary solution)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make persistent
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Security Hardening

### Firewall Rules
```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow 22

# Allow HTTP
ufw allow 80

# Allow HTTPS
ufw allow 443

# Block everything else
ufw default deny incoming
ufw default allow outgoing

# Check status
ufw status
```

### Automatic Updates
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### Change Default SSH Port (Optional)
```bash
nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
systemctl restart sshd

# Update firewall
ufw allow 2222
```

### Fail2Ban (Brute Force Protection)
```bash
apt install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban
```

---

## Performance Tuning

### Increase PostgreSQL Memory
Edit in docker-compose.yml under postgres:
```yaml
environment:
  - shared_buffers=256MB
  - effective_cache_size=1GB
  - work_mem=32MB
```

### Scale n8n Executions
```yaml
# In docker-compose.yml under n8n:
environment:
  - N8N_EXECUTIONS_MAX_RETURNED=5
  - N8N_EXECUTIONS_TIMEOUT=300
  - N8N_GENERIC_POLLING_TRIGGER_INTERVAL=5
```

### Enable Nginx Caching
Already configured in nginx.conf, optimizes static assets.

---

## File Structure

```
/root/seo-audit-app/
├── docker-compose.yml        # Services configuration
├── Dockerfile                # App container image
├── nginx.conf                # Reverse proxy config
├── init-db.sql               # Database initialization
├── .env                      # Environment variables
├── backup.sh                 # Backup script
├── src/                      # App source code
├── prisma/                   # Database schema
└── docs/                     # Documentation
```

---

## Cost Estimate

| Service | Cost | Provider |
|---------|------|----------|
| VPS (2GB RAM, 2vCPU) | $12/month | DigitalOcean |
| Domain | $10-15/year | Any registrar |
| SSL Certificate | FREE | Let's Encrypt |
| Backups | FREE | Local storage |
| **TOTAL** | **~$13/month** | |

---

## Next Steps When Ready

1. ✅ Install Docker
2. ✅ Clone repository
3. ✅ Configure .env
4. ✅ Get SSL certificate
5. ✅ Start with docker-compose up -d
6. ✅ Access https://yourdomain.com
7. ✅ Go to /automation to create workflows
8. ✅ Run audit to trigger automation

---

## Additional Resources

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Let's Encrypt**: https://letsencrypt.org/
- **Nginx**: https://nginx.org/

---

**Ready to deploy? Start with "Quick Install" above!**
