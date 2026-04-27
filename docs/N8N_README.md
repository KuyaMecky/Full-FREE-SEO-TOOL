# n8n Automation Integration

Complete n8n automation system for SEO Audit Pro. Automatically trigger workflows when audits complete.

## Quick Links

- 🚀 **[Getting Started](GETTING_STARTED_N8N.md)** - Step-by-step setup guide (10 min)
- 📚 **[Integration Guide](N8N_INTEGRATION.md)** - Complete API reference
- 🎨 **[Workflow Examples](n8n-examples/)** - Ready-to-use templates
  - Email notifications
  - Slack messages
  - Google Sheets logging

## Overview

The webhook system fires automatically when an audit completes. You can create n8n workflows that react to these webhooks with actions like:

- 📧 Send emails with audit results
- 💬 Post to Slack channels
- 📊 Log results to Google Sheets
- 🎯 Create tasks in project managers
- 🔗 Call custom APIs
- 🎨 Any n8n node and integration

## Architecture

```
SEO Audit Complete
       ↓
triggerWebhook()
       ↓
Find active webhooks for user/event
       ↓
fireWebhookAsync (parallel)
       ↓
Generate HMAC signature (if secret configured)
       ↓
POST to n8n webhook URL
       ↓
n8n workflow processes event
```

## Key Features

✅ **Automatic Firing** - Webhooks trigger instantly when audits complete  
✅ **HMAC Security** - Optional secret verification with SHA256  
✅ **Custom Headers** - Add any headers to webhook requests  
✅ **Failure Tracking** - Auto-disables after 10 consecutive failures  
✅ **Status Monitoring** - View last fired, errors, and failure count  
✅ **Test Endpoint** - Send test webhooks without running audits  

## Files Structure

```
docs/
├── N8N_README.md                    ← You are here
├── GETTING_STARTED_N8N.md          ← Start here for setup
├── N8N_INTEGRATION.md              ← Full API reference
└── n8n-examples/
    ├── README.md                   ← Example guide
    ├── email-on-audit-complete.json
    ├── slack-notification.json
    └── google-sheets-log.json

src/
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── route.ts            ← GET (list), POST (create)
│   │   │   ├── [id]/route.ts       ← DELETE, PATCH
│   │   │   └── test/route.ts       ← POST (test webhook)
│   │   └── analyze/route.ts        ← Triggers webhook on completion
│   ├── components/
│   │   └── webhooks-settings.tsx   ← UI component
│   └── settings/
│       ├── page.tsx                ← Updated to include webhooks link
│       └── webhooks/
│           └── page.tsx            ← Settings page for webhooks
└── lib/
    └── webhooks/
        └── trigger.ts              ← Core webhook firing logic

prisma/
└── schema.prisma                   ← Webhook model definition
```

## Webhook Payload

Every webhook sends this JSON:

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

## API Endpoints

### Get Webhooks
```bash
GET /api/webhooks
Authorization: Bearer {token}
```

### Create Webhook
```bash
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Send to n8n",
  "url": "https://n8n.example.com/webhook/uuid",
  "event": "audit_complete",
  "secret": "optional-secret"
}
```

### Test Webhook
```bash
POST /api/webhooks/test
Content-Type: application/json
Authorization: Bearer {token}

{
  "webhookId": "webhook-id"
}
```

### Update Webhook
```bash
PATCH /api/webhooks/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Updated name",
  "active": true
}
```

### Delete Webhook
```bash
DELETE /api/webhooks/{id}
Authorization: Bearer {token}
```

## Getting Started

1. **UI**: Go to Settings → Webhooks
2. **Create**: Click "New Webhook" and paste your n8n webhook URL
3. **Test**: Click the play button to send test data
4. **Monitor**: Watch the webhook status and error logs

Or use the API directly:

```bash
# Create webhook
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "n8n Email",
    "url": "https://your-n8n-instance.com/webhook/abc123",
    "event": "audit_complete"
  }'

# Test webhook
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"webhookId": "webhook-id"}'
```

## Configuration

### Webhook Model (Database)

```prisma
model Webhook {
  id          String      @id @default(cuid())
  userId      String      // Owner of webhook
  name        String      // Display name
  url         String      // n8n webhook URL
  event       String      // "audit_complete"
  active      Boolean     @default(true)
  secret      String?     // HMAC signature secret
  headers     String      @default("{}")  // JSON custom headers
  lastFiredAt DateTime?   // Last successful fire
  lastError   String?     // Last error message
  failCount   Int         @default(0)     // Consecutive failures
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  user        User        @relation(...)  // Owner reference
}
```

## Security

### HMAC Signature Verification

When a secret is set, every webhook includes:
- `X-Webhook-Signature: sha256=<hex>`
- `X-Webhook-Timestamp: <iso8601>`

Verify in n8n:
```javascript
const crypto = require('crypto');
const signature = $input.first().headers['x-webhook-signature'];
const secret = process.env.WEBHOOK_SECRET;
const body = JSON.stringify($input.first().json);

const hmac = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

const expected = `sha256=${hmac}`;
const verified = crypto.timingSafeEqual(signature, expected);
```

### Failure Handling

- Webhooks are retried with exponential backoff
- After 10 consecutive failures, webhook is auto-disabled
- Failed webhooks can be manually re-enabled in UI
- Last error message is stored and displayed

## Events

Currently supported:
- `audit_complete` - Fired when audit analysis finishes

Future events (roadmap):
- `findings_generated` - New high-priority findings found
- `report_generated` - Report becomes available
- `score_changed` - Overall score changes

## Examples

### Email Notification
See [email-on-audit-complete.json](n8n-examples/email-on-audit-complete.json)

### Slack Message
See [slack-notification.json](n8n-examples/slack-notification.json)

### Google Sheets Logger
See [google-sheets-log.json](n8n-examples/google-sheets-log.json)

## Troubleshooting

### Webhook not firing?
1. ✅ Check webhook is active (toggle in UI)
2. ✅ Verify event is "audit_complete"
3. ✅ Test with "Test" button
4. ✅ Check n8n logs

### n8n not receiving data?
1. ✅ Verify webhook URL is correct
2. ✅ Check n8n workflow is activated
3. ✅ Check n8n logs for incoming request
4. ✅ Ensure webhook node is listening

### Too many failures?
1. ✅ Verify n8n instance is running
2. ✅ Check URL accessibility
3. ✅ Re-enable webhook in UI
4. ✅ Monitor failure rate

## Performance

- Webhooks fire asynchronously (don't block audit completion)
- Each webhook fires independently (parallel execution)
- 10 second timeout per webhook request
- Failed webhooks tracked but don't impact audit flow

## Deployment

### Local Development
- Webhooks work with `localhost:3000`
- n8n must be accessible to receive requests
- Use ngrok for local testing with external n8n

### Production (Vercel)
- Webhooks use `VERCEL_URL` for base URL detection
- All external n8n instances must be HTTPS
- Firewall rules must allow outbound HTTPS
- Rate limits depend on n8n tier

## Monitoring

View webhook status in Settings → Webhooks:
- **Last Fired**: When webhook last successfully executed
- **Fail Count**: Consecutive failures (auto-disables at 10)
- **Last Error**: Error message from last failure
- **Active**: Whether webhook is enabled

## Next Steps

1. 📖 Read [GETTING_STARTED_N8N.md](GETTING_STARTED_N8N.md)
2. 🔗 Copy webhook URL from n8n
3. ➕ Create webhook in SEO Audit Pro
4. ▶️ Test with "Test" button
5. 🎨 Build n8n workflow
6. ✅ Run audit and watch automation trigger!

## Support

- 📚 Full API docs: [N8N_INTEGRATION.md](N8N_INTEGRATION.md)
- 🎨 Examples: [n8n-examples/](n8n-examples/)
- 💬 n8n docs: https://docs.n8n.io/
- 🐛 Report issues on GitHub

---

**Created as part of SEO Audit Pro v1.0**  
Full automation with n8n webhooks integration.
