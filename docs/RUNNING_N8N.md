# Running n8n with SEO Audit Pro

Quick reference for starting n8n and the app together.

## Quick Start (Development)

### Terminal 1: Start n8n
```bash
cd seo-audit-app
npx n8n start
```

Output:
```
n8n is now available on:
http://localhost:5678
```

### Terminal 2: Start SEO Audit Pro
```bash
cd seo-audit-app
npm run dev
```

Output:
```
> ready - started server on 0.0.0.0:3000
```

### Terminal 3 (Optional): Watch logs
```bash
tail -f .n8n-data/logs/
```

### Access the App
1. **SEO Audit Pro**: http://localhost:3000
2. **Automation**: http://localhost:3000/automation
3. **n8n Direct**: http://localhost:5678 (not recommended, use via /automation)

---

## With npm Scripts

If you installed `concurrently`:

```bash
# Development mode (both services)
npm run dev:with-n8n

# Production mode (both services)
npm run start:with-n8n

# Just n8n
npm run n8n

# Just SEO Audit Pro
npm run dev
npm run start
```

---

## Configuration for Different Scenarios

### Local Development
**Terminal 1:**
```bash
npx n8n start
```

**Terminal 2:**
```bash
npm run dev
```

Environment: `.env.local`
```env
N8N_URL=http://localhost:5678
```

---

### Production VPS

**One terminal with pm2:**
```bash
# Install pm2 globally
npm install -g pm2

# Start both services
pm2 start "npm run start" --name "seo-audit"
pm2 start "npx n8n start" --name "n8n"

# View logs
pm2 logs

# Persist on reboot
pm2 startup
pm2 save
```

Environment: `.env`
```env
N8N_URL=http://localhost:5678
NODE_ENV=production
```

---

### Docker

**docker-compose.yml:**
```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      N8N_URL: http://n8n:5678
      DATABASE_URL: postgresql://...
    depends_on:
      - n8n
      - postgres

  n8n:
    image: n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n-data:/home/node/.n8n
    environment:
      N8N_PORT: 5678
      N8N_HOST: 0.0.0.0
      N8N_DB_TYPE: postgresdb
      N8N_DB_POSTGRESDB_HOST: postgres
      N8N_DB_POSTGRESDB_USER: n8n
      N8N_DB_POSTGRESDB_PASSWORD: n8npass
      N8N_DB_POSTGRESDB_DATABASE: n8n

  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: postgres

volumes:
  n8n-data:
  postgres-data:
```

Start:
```bash
docker-compose up -d
```

Access:
- App: http://localhost:3000/automation
- n8n direct: http://localhost:5678

---

## Troubleshooting Startup

### Port Already in Use

**Port 5678 (n8n):**
```bash
# Check what's using it
lsof -i :5678

# Kill the process
kill -9 <PID>

# Or use different port
N8N_PORT=5679 npx n8n start
# Then update .env: N8N_URL=http://localhost:5679
```

**Port 3000 (SEO Audit Pro):**
```bash
# Check
lsof -i :3000

# Kill
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### "Cannot find module 'n8n'"

**Solution:**
```bash
npm install n8n
npx n8n start
```

### "n8n is not running" Error

1. Check n8n terminal for errors
2. Verify n8n started successfully
3. Check `.env.local` has correct `N8N_URL`
4. Try accessing http://localhost:5678 in browser

### Database Locked

SQLite database is locked (another process accessing):

```bash
# Kill any n8n processes
pkill -f "n8n start"

# Remove lock file
rm .n8n-data/database.sqlite-shm
rm .n8n-data/database.sqlite-wal

# Restart
npx n8n start
```

### Out of Memory

n8n uses significant memory. Increase:

```bash
# Terminal 1: n8n with more memory
node --max-old-space-size=4096 ./node_modules/n8n/bin/n8n.js start

# Or via environment
NODE_OPTIONS=--max-old-space-size=4096 npx n8n start
```

---

## Health Checks

### Check if n8n is running
```bash
curl http://localhost:5678/api/health
# Should return: {"status":"ok"}
```

### Check if SEO Audit Pro can reach n8n
```bash
curl http://localhost:3000/api/n8n/init
# Should return: {"running":true,"message":"n8n is running","n8nUrl":"..."}
```

### View n8n logs
```bash
# In n8n terminal (automatic)
# Or check log file
tail -f .n8n-data/logs/n8n.log
```

### View app logs
```bash
# In app terminal (automatic)
# Or check
tail -f .next/trace.json
```

---

## Stopping Services

### Graceful Shutdown

**If running in separate terminals:**
- Press `Ctrl+C` in n8n terminal
- Press `Ctrl+C` in app terminal

**If running with pm2:**
```bash
pm2 stop all
pm2 delete all
```

**If running with Docker:**
```bash
docker-compose down
```

---

## Performance Tips

### Memory
```bash
# Give n8n more memory
NODE_OPTIONS=--max-old-space-size=4096 npx n8n start
```

### Database
Use PostgreSQL instead of SQLite for production:
```env
N8N_DB_TYPE=postgresdb
N8N_DB_POSTGRESDB_CONNECTION_STRING=postgresql://user:pass@host:5432/n8n
```

### Execution Limits
```env
# Limit execution history (less disk)
N8N_EXECUTIONS_MAX_RETURNED=5

# Execution timeout (5 minutes)
N8N_EXECUTIONS_TIMEOUT=300

# Prune old executions (30 days)
N8N_EXECUTIONS_DATA_PRUNE_TIMEOUT=2592000
```

### Parallel Executions
```env
# How many workflows can run simultaneously
N8N_GENERIC_POLLING_TRIGGER_INTERVAL=5

# Queue size
N8N_QUEUE_SIZE=10
```

---

## Common Workflows to Test

### 1. Verify Integration Works
1. Go to http://localhost:3000/automation
2. Should see n8n UI
3. Try creating new workflow
4. Add webhook trigger with path `test-webhook`
5. Click "Test webhook" button
6. Should receive event

### 2. Email on Audit Complete
1. Create workflow with webhook trigger
2. Add Code node to format email
3. Add Email node (Gmail/SendGrid)
4. Deploy
5. Run SEO audit
6. Email should send

### 3. Slack Notification
1. Create workflow
2. Add Slack integration
3. Test by running audit
4. Message appears in Slack

---

## Data & Backup

### SQLite Database
```
.n8n-data/database.sqlite
```

Contains:
- All workflows
- Execution history
- Credentials (encrypted)

**Backup:**
```bash
cp -r .n8n-data/ .n8n-data.backup/
```

### Reset Everything
```bash
# WARNING: Deletes all workflows and data!
rm -rf .n8n-data/
npx n8n start
```

---

## Logs & Debugging

### Enable Debug Logging
```bash
DEBUG=n8n* npx n8n start
```

### Check Execution Logs
1. Go to /automation
2. Click "Executions" (top right)
3. Click any execution to see details
4. View input, output, errors

### Check Audit Integration
1. Go to /api/analyze in network tab
2. Should see webhook trigger in console
3. Check n8n received event

---

## Next Steps

1. ✅ Both services running
2. ⏳ Go to http://localhost:3000/automation
3. ⏳ Create first workflow
4. ⏳ Connect n8n to external service (email, Slack, etc)
5. ⏳ Run SEO audit to test automation

---

**Need help?** See N8N_APP_SETUP.md for detailed configuration.
