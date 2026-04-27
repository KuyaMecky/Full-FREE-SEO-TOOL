# n8n Workflow Examples

Ready-to-use n8n workflow templates that integrate with SEO Audit Pro webhooks.

## Quick Start

1. **In n8n**: Create new workflow → select "Webhook" node from triggers
2. **Copy webhook URL** from n8n
3. **In SEO Audit Pro**: Settings → Webhooks → New Webhook
4. **Paste URL** and select event (audit_complete)
5. **In n8n**: Paste your SEO Audit Pro webhook URL into the Webhook node
6. **Deploy** the n8n workflow
7. **Test** from SEO Audit Pro webhook management page

## Available Examples

### 1. Email Notification
**File**: `email-on-audit-complete.json`

Sends an email with audit results whenever an audit completes.

**What it does:**
- Receives audit_complete webhook
- Extracts domain, score, and issue counts
- Builds HTML email with results
- Sends to configured email address

**Setup**:
1. Import the JSON file into n8n
2. Update email address in "Build Email" node
3. Configure email credentials (Gmail, SendGrid, etc.)
4. Deploy workflow
5. In SEO Audit Pro: Settings → Webhooks, paste the n8n webhook URL

### 2. Slack Notification
**File**: `slack-notification.json`

Posts audit results to Slack with color-coded score.

**What it does:**
- Receives audit_complete webhook
- Creates Slack message with score breakdown
- Color codes by performance (green ≥80, amber ≥60, red <60)
- Posts to #seo-audits channel

**Setup**:
1. Import the JSON file into n8n
2. Connect Slack credentials (requires Slack OAuth)
3. Update channel name if needed
4. Deploy workflow
5. In SEO Audit Pro: paste the n8n webhook URL

### 3. Google Sheets Logger
**File**: `google-sheets-log.json`

Logs all audit results to a Google Sheet for historical tracking.

**What it does:**
- Receives audit_complete webhook
- Extracts all score data and finding counts
- Appends row to Google Sheet with timestamp
- Creates audit report link

**Setup**:
1. Create a Google Sheet with headers:
   - Timestamp
   - Domain
   - Overall Score
   - Technical
   - On-Page
   - Content
   - UX/Performance
   - Total Findings
   - Critical Issues
   - High Issues
   - Report Link

2. Import the JSON file into n8n
3. Connect Google Sheets credentials
4. Update spreadsheet ID in "Transform Data" node
5. Deploy workflow
6. In SEO Audit Pro: paste the n8n webhook URL

## Webhook Payload Structure

Every webhook fires with this JSON payload:

```json
{
  "event": "audit_complete",
  "timestamp": "2026-04-27T12:00:00.000Z",
  "data": {
    "auditId": "audit-123",
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

## Building Custom Workflows

### Using Code Node

Add a JavaScript code node after the webhook to transform data:

```javascript
const data = $input.first().json.data;

// Access webhook data
const domain = data.domain;
const score = data.overallScore;
const criticalCount = data.criticalIssues;

// Transform for your needs
return {
  status: score >= 80 ? 'excellent' : 'needs-attention',
  recommendation: criticalCount > 0 ? 'Fix critical issues first' : 'Good foundation'
};
```

### Common Recipes

**Send to Discord**:
```javascript
return {
  webhook_url: process.env.DISCORD_WEBHOOK,
  content: `SEO Audit: ${$input.first().json.data.domain} scored ${$input.first().json.data.overallScore}/100`
};
```

**Create Asana Task**:
```javascript
const data = $input.first().json.data;
return {
  name: `Review SEO Audit for ${data.domain}`,
  notes: `Overall Score: ${data.overallScore}/100\nCritical Issues: ${data.criticalIssues}`,
  due_on: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
};
```

**Update Airtable**:
```javascript
const data = $input.first().json.data;
return {
  records: [{
    fields: {
      Domain: data.domain,
      Score: data.overallScore,
      'Last Audited': new Date().toISOString(),
      'Critical Issues': data.criticalIssues,
      'Report Link': `https://your-app.com/audit/${data.auditId}`
    }
  }]
};
```

## Security Notes

- **Secrets**: Optional but recommended. When you set a webhook secret in SEO Audit Pro, n8n receives `X-Webhook-Signature` header with HMAC-SHA256 signature
- **Headers**: Custom headers can be added to each webhook in SEO Audit Pro settings
- **Validation**: Always validate webhook signatures in production

## Troubleshooting

### Webhook Not Firing
1. Check SEO Audit Pro webhook is marked "Active"
2. Verify event is `audit_complete`
3. Use "Test" button in SEO Audit Pro to send test webhook
4. Check n8n workflow logs for incoming request

### Wrong Data in Workflow
1. Verify webhook URL is correct in n8n
2. Check that test webhook data matches your expectations
3. Use "Test" button with real webhook URL to verify

### Email/Slack Not Sending
1. Verify credentials are properly configured in n8n
2. Check n8n logs for error details
3. Test the n8n node independently (without webhook) to isolate issue

## Advanced: Multiple Workflows

You can fire multiple n8n workflows by creating multiple webhooks in SEO Audit Pro:

1. Create webhook 1 → n8n Email workflow
2. Create webhook 2 → n8n Slack workflow
3. Create webhook 3 → n8n Google Sheets workflow

All will fire simultaneously when an audit completes.

## Need Help?

- See [N8N_INTEGRATION.md](../N8N_INTEGRATION.md) for full API documentation
- Check n8n docs: https://docs.n8n.io/
- n8n examples library: https://n8n.io/workflows/
