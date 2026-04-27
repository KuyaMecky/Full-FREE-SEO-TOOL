# n8n Embedded in SEO Audit Pro

**n8n is now fully integrated into SEO Audit Pro.** Users have access to the complete n8n workflow automation platform directly within the app — no external setup, no extra logins, no iframes.

## What This Means

✅ **Full n8n Access** - 400+ integrations (Slack, Gmail, Google Sheets, Stripe, etc.)  
✅ **Direct UI** - Build workflows in native n8n interface  
✅ **Auto-Triggers** - Workflows trigger automatically when audits complete  
✅ **No Setup** - Everything runs in the same process  
✅ **One-Click Deployment** - Workflows activate immediately  

## Architecture

```
┌─────────────────────────────────────┐
│   SEO Audit Pro (Next.js)           │
├─────────────────────────────────────┤
│ Pages:                              │
│ ├─ /audit                           │
│ ├─ /automation         ← NEW!       │
│ ├─ /settings                        │
│ └─ ...                              │
├─────────────────────────────────────┤
│ API Routes:                         │
│ ├─ /api/analyze (triggers webhooks) │
│ ├─ /api/n8n/init                    │
│ ├─ /api/n8n/proxy                   │
│ └─ /n8n/[[...path]]  (reverse proxy)│
├─────────────────────────────────────┤
│ Services:                           │
│ ├─ n8n Engine (port 5678)           │
│ ├─ Workflow Executor                │
│ ├─ SQLite Database                  │
│ └─ Webhook Server                   │
└─────────────────────────────────────┘
```

## Getting Started (5 minutes)

### 1. Start Services
**Terminal 1 - n8n:**
```bash
npx n8n start
```

**Terminal 2 - App:**
```bash
npm run dev
```

### 2. Access Automation
Open: **http://localhost:3000/automation**

You'll see the full n8n interface loaded directly in your app.

### 3. Create Workflow
1. Click "New" → "Blank workflow"
2. Add **Webhook** trigger (incoming)
3. Click the webhook node and copy the path
4. Add action nodes (Email, Slack, Code, etc.)
5. Click **Deploy** to activate

### 4. Test Trigger
1. Run an SEO audit from /audit/new
2. When complete, your workflow executes automatically
3. See results in `/automation` → Executions

## Features

### Automatic Audit Triggers
When audit completes:
```javascript
// Automatically sends to all active webhooks
triggerWebhook(userId, "audit_complete", {
  auditId: "...",
  domain: "example.com",
  overallScore: 85,
  scores: { ... },
  findingsCount: 15,
  criticalIssues: 2,
  highIssues: 5
})
```

### Workflow Examples

**Email Alerts**
```
Webhook → Code (format email) → Gmail Send
```

**Slack Updates**
```
Webhook → Code (format message) → Slack Send Message
```

**Google Sheets Logger**
```
Webhook → Google Sheets Append Row
```

**Multiple Actions**
```
Webhook → (parallel)
  ├─→ Email
  ├─→ Slack  
  └─→ Google Sheets
```

## Files & Routes

### Pages
- `/automation` - Full n8n UI
- `/settings` - Link to automation

### API Routes
- `GET /api/n8n/init` - Health check
- `POST /api/n8n/init` - Initialize
- `GET/POST/etc /api/n8n/proxy/**` - Proxy to n8n API
- `GET/POST/etc /n8n/**` - Reverse proxy to n8n UI

### Services
- `src/lib/n8n/service.ts` - n8n process management
- `src/lib/n8n/client.ts` - n8n API client

### Data
- `.n8n-data/` - Workflows, credentials, database
- `.n8n-data/database.sqlite` - All data stored here

## Configuration

### Environment Variables
```env
# Required
N8N_URL=http://localhost:5678

# Optional
N8N_PORT=5678                    # n8n port
N8N_HOST=localhost               # n8n host
N8N_ENCRYPTION_KEY=your-key      # Credential encryption
N8N_DB_TYPE=sqlite               # Or postgresdb for production
```

### Data Persistence
- **Development**: SQLite in `.n8n-data/database.sqlite`
- **Production**: PostgreSQL recommended

Change database:
```env
N8N_DB_TYPE=postgresdb
N8N_DB_POSTGRESDB_CONNECTION_STRING=postgresql://user:pass@host/n8n
```

## How Workflows Trigger

1. **Audit Completes** (in `/api/analyze`)
   ```typescript
   await triggerWebhook(userId, "audit_complete", auditData);
   ```

2. **Webhook Found** (in `src/lib/webhooks/trigger.ts`)
   - Queries database for active webhooks matching event
   - Fires asynchronously (doesn't block audit)

3. **n8n Receives Event**
   - Webhook node in workflow gets triggered
   - All connected nodes execute in sequence

4. **Workflow Executes**
   - Code nodes transform data
   - Action nodes (Email, Slack, etc.) execute
   - Results logged in execution history

5. **User Sees Results**
   - Check `/automation` → Executions tab
   - View input/output of each node
   - See errors if anything fails

## Authentication & Security

### User Access Control
Users can only access workflows via authenticated routes:
- `/automation` - Requires login
- `/api/n8n/*` - Requires session
- `/n8n/*` - Requires session

### Credential Encryption
All n8n credentials encrypted with `N8N_ENCRYPTION_KEY`:
- Stored encrypted in database
- Only decrypted when needed
- Change key for rotation: https://docs.n8n.io/hosting/n8n-basics/encrypt-credentials/

### Webhook Security (Optional)
Add authentication to webhook triggers:
- Set secret in SEO Audit Pro
- Verify signature in n8n with HMAC-SHA256
- Only accept signed requests

## Production Deployment

### VPS/Self-Hosted
```bash
# Install PM2
npm install -g pm2

# Start both services
pm2 start "npm run start" --name "seo-audit"
pm2 start "npx n8n start" --name "n8n"

# Persist
pm2 startup
pm2 save
```

### Vercel
⚠️ **Won't work** - Vercel is serverless, n8n needs persistent server.

Use VPS, DigitalOcean, AWS EC2, Heroku, or Railway instead.

### Docker
```bash
docker-compose up -d
```

See `docker-compose.yml` in docs.

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/n8n/init
# {"running":true,"message":"n8n is running"}
```

### View Executions
1. Go to `/automation`
2. Click "Executions" (right side)
3. See all workflow runs
4. Click to view details

### Check Logs
```bash
# n8n logs (in terminal)
# Enable debug
DEBUG=n8n* npx n8n start

# App logs (in terminal)
npm run dev
```

## Limits & Performance

### Execution Limits
- Default timeout: 30 minutes per execution
- Queue: 10 concurrent executions
- Memory: Increase with `NODE_OPTIONS=--max-old-space-size=4096`

### Data Retention
- SQLite: ~500MB for 10k executions
- PostgreSQL: Unlimited

Configure:
```env
# Keep last 10 executions only
N8N_EXECUTIONS_MAX_RETURNED=10

# Timeout after 5 minutes
N8N_EXECUTIONS_TIMEOUT=300

# Auto-prune after 30 days
N8N_EXECUTIONS_DATA_PRUNE_TIMEOUT=2592000
```

## Troubleshooting

### "n8n is not running"
1. Start n8n in terminal: `npx n8n start`
2. Check port 5678 is open: `lsof -i :5678`
3. Check logs for errors

### Workflows not triggering
1. Verify workflow is **deployed** (toggle on)
2. Check webhook path is configured
3. Run audit and watch n8n execution logs
4. Check app logs for webhook trigger calls

### Slow performance
1. Reduce execution history: `N8N_EXECUTIONS_MAX_RETURNED=5`
2. Increase memory: `NODE_OPTIONS=--max-old-space-size=4096`
3. Use PostgreSQL instead of SQLite
4. Check disk space

### Data lost
1. Backup `.n8n-data/` directory
2. Use PostgreSQL for production (more reliable)
3. Set up automated backups

## Integrations Available

n8n includes 400+ integrations:

**Communication**
- Slack, Discord, Telegram, Microsoft Teams, Twilio

**Email**
- Gmail, SendGrid, AWS SES, Mailgun, Nodemailer

**CMS**
- WordPress, Ghost, Strapi, Contentful, Sanity

**Spreadsheets**
- Google Sheets, Airtable, Excel

**Databases**
- PostgreSQL, MySQL, MongoDB, Firebase

**Payment**
- Stripe, PayPal, Square

**Project Tools**
- Asana, Monday.com, Linear, Jira

**Analytics**
- Google Analytics, Mixpanel, Segment

**And 350+ more...**

Full list: https://n8n.io/integrations/

## Advanced Topics

### Custom Nodes
Place custom nodes in `.n8n-data/custom_nodes/`:
```bash
.n8n-data/
└── custom_nodes/
    └── my-node.js
```

### Connecting Databases
```javascript
// In Code node, use n8n's built-in nodes:
// PostgreSQL node → query database
// Insert → add row
// Update → modify row
```

### Webhook Authentication
```javascript
// Verify HMAC signature in Code node
const crypto = require('crypto');
const sig = $request.headers['x-webhook-signature'];
const body = JSON.stringify($input.first().json);
const hmac = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
return crypto.timingSafeEqual(sig, `sha256=${hmac}`);
```

## Next Steps

1. **Start services** (see "Getting Started")
2. **Go to /automation** in your app
3. **Create first workflow** (email, Slack, etc.)
4. **Run SEO audit** to test
5. **Watch automation execute** in Executions tab
6. **Build more workflows** for your needs

## Support

- **n8n Docs**: https://docs.n8n.io/
- **Workflows Library**: https://n8n.io/workflows/
- **Community Forum**: https://community.n8n.io/
- **GitHub**: https://github.com/n8n-io/n8n

## Quick Reference

| Task | Command |
|------|---------|
| Start n8n | `npx n8n start` |
| Start app | `npm run dev` |
| Both together | `npm run dev:with-n8n` *(if concurrently installed)* |
| Access n8n | `http://localhost:3000/automation` |
| Check health | `curl http://localhost:3000/api/n8n/init` |
| View executions | `/automation` → Executions tab |
| Reset data | `rm -rf .n8n-data/` |

---

**n8n is now embedded and ready to use!**

See docs for detailed guides:
- `RUNNING_N8N.md` - How to start services
- `N8N_APP_SETUP.md` - Full configuration
- `N8N_INTEGRATION.md` - API reference *(external n8n only)*
