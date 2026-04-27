# n8n Integrated in SEO Audit Pro

n8n automation is now fully integrated into SEO Audit Pro. Users can create and manage workflows directly within the app without any external setup.

## Architecture

```
SEO Audit Pro (Next.js App)
    ├── /automation page (iframe to n8n)
    ├── Reverse proxy at /n8n/** → n8n instance
    └── API routes for n8n interaction
            └── n8n Service (runs on port 5678 by default)
                ├── SQLite database (.n8n-data/)
                ├── Workflow engine
                └── Webhook system
```

## Quick Start

### 1. Install (Already Done)
```bash
npm install n8n
```

### 2. Start n8n

#### Option A: Standalone (Development)
```bash
# Start n8n on port 5678
npm run n8n

# Or
npx n8n start
```

#### Option B: With SEO Audit Pro
Create a new npm script in package.json:
```json
{
  "scripts": {
    "dev:full": "concurrently \"npm run dev\" \"npm run n8n\""
  }
}
```

Then:
```bash
npm install concurrently --save-dev
npm run dev:full
```

### 3. Access n8n
Once both services are running:
1. Go to http://localhost:3000/automation
2. n8n UI loads within SEO Audit Pro
3. Create workflows immediately

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# n8n settings
N8N_PORT=5678
N8N_HOST=localhost
N8N_URL=http://localhost:5678

# Production security key (change this!)
N8N_ENCRYPTION_KEY=your-secure-key-here-change-in-production

# Database (sqlite by default)
N8N_DB_TYPE=sqlite
N8N_DB_SQLITE_FILE=.n8n-data/database.sqlite

# Node options for better performance
NODE_OPTIONS=--max-old-space-size=4096
```

### Recommended Settings

```env
# Production
N8N_SECURE_COOKIE=true
N8N_EXECUTIONS_TIMEOUT=300  # 5 min timeout
N8N_EXECUTIONS_MAX_RETURNED=10  # Limit execution history

# Optional: PostgreSQL for production
N8N_DB_TYPE=postgresdb
N8N_DB_POSTGRESDB_CONNECTION_STRING=postgresql://user:pass@host:5432/n8n
```

## File Structure

```
src/
├── app/
│   ├── automation/
│   │   └── page.tsx              # Automation UI page
│   ├── n8n/
│   │   ├── [[...path]]/
│   │   │   └── route.ts          # Reverse proxy to n8n
│   │   └── ...
│   └── api/
│       ├── n8n/
│       │   ├── init/route.ts     # Initialize n8n
│       │   └── proxy/route.ts    # API proxy for calls
│       └── analyze/route.ts      # Updated to trigger n8n
├── lib/
│   └── n8n/
│       ├── service.ts            # n8n service manager
│       └── client.ts             # n8n API client
└── ...

.n8n-data/
├── database.sqlite               # Workflows & executions stored here
├── workflows/                    # Workflow files
└── ...
```

## How It Works

### User Flow

1. **Access Automation**
   - User clicks Settings → "n8n Automation"
   - Loads `/automation` page
   - Reverse proxy at `/n8n/` serves n8n UI

2. **Create Workflow**
   - User builds workflow in n8n UI
   - Adds webhook trigger (audit events)
   - Creates action nodes (email, slack, etc)
   - Deploys workflow

3. **Audit Triggers Workflow**
   - Audit completes in SEO Audit Pro
   - `triggerWebhook()` in `/api/analyze`
   - n8n receives webhook event
   - Workflow executes with audit data

### Webhook Event Structure

When audit completes, n8n receives:

```json
{
  "event": "audit_complete",
  "timestamp": "2026-04-27T12:00:00.000Z",
  "data": {
    "auditId": "cuid-123",
    "domain": "example.com",
    "overallScore": 85,
    "scores": {
      "overall": 85,
      "technical": 80,
      "onPage": 90,
      "content": 85,
      "uxPerformance": 75
    },
    "findingsCount": 15,
    "criticalIssues": 2,
    "highIssues": 5
  }
}
```

## Building Workflows

### Example 1: Email on Audit Complete

1. Go to `/automation`
2. Click "New"
3. Add **Webhook** trigger
   - Method: POST
   - Path: `audit-event` (or any path)
4. Add **Code** node
   ```javascript
   const data = $input.first().json.data;
   return {
     to: 'your@email.com',
     subject: `Audit: ${data.domain} - ${data.overallScore}/100`,
     html: `Score: ${data.overallScore}, Issues: ${data.findingsCount}`
   };
   ```
5. Add **Email** node (Gmail, SendGrid, etc)
   - Configure credentials
   - Map fields from Code node
6. **Deploy** workflow
7. Run audit → Email sends automatically

### Example 2: Slack Notification

```
Webhook → Code → Slack Send Message
```

**Code node:**
```javascript
const score = $input.first().json.data.overallScore;
return {
  text: `🔍 Audit: ${$input.first().json.data.domain}`,
  blocks: [{
    type: "section",
    text: {
      type: "mrkdwn",
      text: `Score: *${score}/100*`
    }
  }]
};
```

### Example 3: Google Sheets Logger

```
Webhook → Code → Google Sheets Append Row
```

Maps audit data to spreadsheet columns.

## API Routes

### Health Check
```bash
GET /api/n8n/init
# Check if n8n is running
# Response: { running: true, n8nUrl: "..." }
```

### Initialize n8n
```bash
POST /api/n8n/init
# Set up default webhooks
# Response: { success: true }
```

### Proxy to n8n API
```bash
GET/POST/PUT/DELETE /api/n8n/proxy/**
# Authenticated proxy to n8n API
# Access: /api/n8n/proxy/workflows, /api/n8n/proxy/executions, etc
```

## Production Deployment

### On Vercel

1. **Add environment variables**
   ```
   N8N_PORT=5678
   N8N_HOST=0.0.0.0
   N8N_ENCRYPTION_KEY=<generate-secure-key>
   N8N_DB_TYPE=postgresdb
   N8N_DB_POSTGRESDB_CONNECTION_STRING=<your-postgres-uri>
   ```

2. **n8n won't work on serverless**
   - Vercel functions are stateless
   - n8n needs persistent server
   - **Solution**: Use self-hosted VPS or Hobby tier server

### On VPS (Recommended)

```bash
# Install Node.js
sudo apt update
sudo apt install nodejs npm

# Clone and setup
git clone <your-repo>
cd seo-audit-app
npm install

# Start with PM2
npm install -g pm2
pm2 start "npm start" --name "seo-audit"

# Start n8n in parallel
pm2 start "npx n8n start" --name "n8n"

# Persist
pm2 startup
pm2 save
```

### Docker Compose (Optional)

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      N8N_URL: http://n8n:5678
    depends_on:
      - n8n
      
  n8n:
    image: n8n
    ports:
      - "5678:5678"
    volumes:
      - n8n-data:/root/.n8n
    environment:
      N8N_DB_TYPE: sqlite
      
volumes:
  n8n-data:
```

## Troubleshooting

### "n8n is not running"
- Start n8n: `npx n8n start`
- Check port 5678 is available: `lsof -i :5678`
- Check firewall isn't blocking

### Workflows not triggering
1. Check audit is completing (not erroring)
2. Check n8n workflow is activated (toggle on)
3. Check webhook path matches audit event
4. Check n8n execution logs

### Slow performance
- Limit execution history: `N8N_EXECUTIONS_MAX_RETURNED=5`
- Increase memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Use PostgreSQL instead of SQLite

### Workflows not saving
- Check `.n8n-data/` directory exists and has write permissions
- Check disk space
- Check database connection (if PostgreSQL)

## Advanced

### Custom Nodes
Place custom nodes in `.n8n-data/custom_nodes/`:
```bash
.n8n-data/
└── custom_nodes/
    └── my-custom-node.js
```

### Connecting External Services
n8n has 400+ integrations:
- Email (Gmail, SendGrid, AWS SES)
- Chat (Slack, Discord, Telegram)
- CMS (WordPress, Ghost, Strapi)
- Databases (Postgres, MongoDB, MySQL)
- APIs (REST, GraphQL, Stripe, Twilio)
- Spreadsheets (Google Sheets, Airtable)
- Project tools (Asana, Monday, Linear)

### Execution Data
All execution data stored in:
- **SQLite**: `.n8n-data/database.sqlite`
- **PostgreSQL**: Your database

Access logs at `/automation` → Executions tab.

## Security Notes

### IMPORTANT
1. **Change `N8N_ENCRYPTION_KEY`** in production
   - Generate: `openssl rand -base64 32`
   - Used for credential encryption

2. **Use HTTPS** in production
   - n8n workflows may contain sensitive data
   - Credentials encrypted but browser traffic must be HTTPS

3. **Restrict Webhook Access**
   - All webhooks public by default
   - Anyone with path can trigger
   - Optionally add authentication

4. **Audit Permissions**
   - Users accessing `/automation` can create any workflow
   - Can call external APIs, databases, send emails
   - **Recommendation**: Only allow admins access to `/automation`

### Restrict Access

Add auth check in `src/app/automation/page.tsx`:
```typescript
// Check if user is admin
if (session?.role !== 'admin') {
  return <div>Access denied</div>;
}
```

## Support & Resources

- **n8n Docs**: https://docs.n8n.io/
- **Workflow Examples**: https://n8n.io/workflows/
- **Community**: https://community.n8n.io/
- **GitHub**: https://github.com/n8n-io/n8n

## Next Steps

1. ✅ n8n installed and integrated
2. ⏳ Start n8n service: `npx n8n start`
3. ⏳ Go to `/automation` in SEO Audit Pro
4. ⏳ Create your first workflow
5. ⏳ Run an audit to trigger it

---

**n8n integration complete!**
Full automation platform now built into SEO Audit Pro.
