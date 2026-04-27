# n8n Integration Guide

This guide shows how to integrate n8n automation workflows with SEO Audit Pro.

## Setup

### 1. Create Webhooks in SEO Audit Pro

Webhooks can be managed via:
- **API**: POST `/api/webhooks` to create
- **UI**: Settings → Webhooks (when UI is added)

### 2. Webhook Events

Currently supported events:
- `audit_complete` - Fired when an audit finishes analysis

### 3. Webhook Payload

When an event fires, n8n receives:

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
      "on-page": 90,
      "content": 85,
      "ux-performance": 75
    },
    "findingsCount": 15,
    "criticalIssues": 2,
    "highIssues": 5
  }
}
```

## n8n Workflows

### Example 1: Email Report on Audit Complete

```
[Webhook Trigger] → [Format Email] → [Send Email]

1. Webhook trigger for "audit_complete" event
2. Build email from audit data
3. Send to configured recipients
```

### Example 2: Slack Notification

```
[Webhook Trigger] → [Build Slack Message] → [Send to Slack]

1. Receive webhook
2. Format data as Slack message with score breakdown
3. Post to Slack channel
```

### Example 3: Google Sheets Log

```
[Webhook Trigger] → [Transform Data] → [Google Sheets Append]

1. Receive webhook
2. Map audit data to row format
3. Append to Google Sheets for tracking
```

### Example 4: Create Tasks in Project Manager

```
[Webhook Trigger] → [Filter Critical Issues] → [Create Tasks] → [Assign to Team]

1. Receive webhook
2. Extract critical/high issues
3. Create task per issue
4. Assign based on issue category
```

## API Endpoints

### Get Webhooks
```bash
GET /api/webhooks
```

### Create Webhook
```bash
POST /api/webhooks
Content-Type: application/json

{
  "name": "Send to n8n",
  "url": "https://your-n8n-instance.com/webhook/uuid",
  "event": "audit_complete",
  "secret": "optional-secret-for-hmac"
}
```

### Update Webhook
```bash
PATCH /api/webhooks/{id}
Content-Type: application/json

{
  "name": "Updated name",
  "active": true
}
```

### Delete Webhook
```bash
DELETE /api/webhooks/{id}
```

### Test Webhook
```bash
POST /api/webhooks/test
Content-Type: application/json

{
  "webhookId": "webhook-id"
}
```

## n8n Setup Steps

### 1. Create n8n Workflow

1. In n8n, create a new workflow
2. Add a "Webhook" trigger node
3. Copy the webhook URL from n8n

### 2. Register Webhook in SEO Audit Pro

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "n8n Workflow",
    "url": "https://your-n8n-instance.com/webhook/uuid",
    "event": "audit_complete"
  }'
```

### 3. Test the Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "webhookId": "webhook-id-from-response"
  }'
```

### 4. Build Your Workflow

In n8n, add nodes after the webhook trigger:
- **Email**: Send audit report via email
- **Slack**: Post results to Slack
- **Google Sheets**: Log results to spreadsheet
- **Asana/Monday**: Create tasks for issues
- **Discord**: Send notifications
- **Custom HTTP**: Call other APIs

## Security

### HMAC Signature Verification

If you set a `secret` when creating a webhook, n8n receives:

```
X-Webhook-Signature: sha256=<hmac-sha256-signature>
X-Webhook-Timestamp: 2026-04-27T12:00:00.000Z
```

To verify in n8n:
```javascript
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const body = JSON.stringify(req.body);
const secret = process.env.WEBHOOK_SECRET;

const hmac = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

const expected = `sha256=${hmac}`;
const verified = crypto.timingSafeEqual(signature, expected);
```

## Examples

### Email on Audit Complete

```n8n
Webhook → Code → Send Email

Code Node:
return {
  to: ['your@email.com'],
  subject: `SEO Audit Complete: ${data.domain} - Score: ${data.data.overallScore}/100`,
  html: `
    <h1>Audit Complete</h1>
    <p>Domain: ${data.data.domain}</p>
    <p>Score: ${data.data.overallScore}/100</p>
    <ul>
      <li>Critical Issues: ${data.data.criticalIssues}</li>
      <li>High Issues: ${data.data.highIssues}</li>
      <li>Total Findings: ${data.data.findingsCount}</li>
    </ul>
  `
};
```

### Slack Notification

```n8n
Webhook → Code → Slack

Code Node:
const score = data.data.overallScore;
const color = score >= 80 ? '#36a64f' : score >= 60 ? '#ffa500' : '#ff0000';

return {
  text: `🔍 SEO Audit Complete`,
  attachments: [{
    color: color,
    title: data.data.domain,
    fields: [
      { title: 'Score', value: `${score}/100`, short: true },
      { title: 'Critical', value: String(data.data.criticalIssues), short: true },
      { title: 'High', value: String(data.data.highIssues), short: true },
      { title: 'Total Findings', value: String(data.data.findingsCount), short: true }
    ]
  }]
};
```

## Webhook Status

- **Active**: Webhook is enabled
- **Fail Count**: Increments on failure, auto-disables after 10 consecutive failures
- **Last Error**: Shows most recent error message
- **Last Fired**: Timestamp of last successful fire

## Troubleshooting

### Webhook Not Firing

1. Check webhook is active: `GET /api/webhooks`
2. Check event matches: should be `audit_complete`
3. Test webhook: `POST /api/webhooks/test`
4. Check n8n logs for incoming request

### Invalid Signature

1. Ensure secret matches in both systems
2. Use `X-Webhook-Signature` header for verification
3. Include full body in HMAC calculation

### High Failure Rate

1. Check n8n webhook URL is accessible
2. Verify n8n instance is running
3. Review n8n logs for error details
4. Test with `POST /api/webhooks/test`
