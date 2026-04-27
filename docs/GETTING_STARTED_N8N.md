# Getting Started with n8n Integration

This guide walks you through setting up n8n automation with SEO Audit Pro. In 10 minutes, you'll have automated workflows running on every audit completion.

## What You Can Do

✅ Send email reports automatically  
✅ Post results to Slack  
✅ Log results to Google Sheets  
✅ Create tasks in project managers  
✅ Trigger custom webhooks  

## Prerequisites

- SEO Audit Pro account
- n8n account or self-hosted n8n instance (https://n8n.io/)
- Optional: Email service, Slack workspace, or Google account

## Step 1: Create Your First Webhook in n8n

### In n8n:

1. **Create a new workflow**
   - Click "New" → "Workflow"

2. **Add a webhook trigger**
   - Search for "Webhook" in node search
   - Click "Webhook" under Triggers
   - Select "Wait for webhooks to arrive"
   - Save the workflow (give it a name like "SEO Audit Email")

3. **Copy the webhook URL**
   - Look at the webhook node
   - Copy the URL shown (it looks like `https://n8n.example.com/webhook/abc123`)
   - Keep this open in a tab

## Step 2: Register the Webhook in SEO Audit Pro

### In SEO Audit Pro:

1. **Go to Settings → Webhooks**
   - Click the "New Webhook" button

2. **Fill in the form**
   - **Name**: "n8n Email" (or your workflow name)
   - **URL**: Paste the n8n webhook URL from Step 1
   - **Event**: Select "Audit Complete"
   - **Secret** (optional): Leave blank for now

3. **Click "Create"**
   - Your webhook is now registered

## Step 3: Test the Webhook Connection

### In SEO Audit Pro:

1. **Find your new webhook** in the list
2. **Click the play button** (▶️) to send a test
3. **Watch for success message**
   - ✅ Green checkmark = Connection works!
   - ❌ Red error = Check webhook URL in n8n

### In n8n:

1. **Check the webhook node**
   - You should see the test data arrived
   - Shows timestamp, domain "example.com", score 85, etc.

## Step 4: Build Your Workflow

Now that the webhook is connected, add nodes to process the data.

### Example 1: Email Notification

1. **After the webhook node**, click the "+" button
2. **Search for "Code"** and select "Code"
3. **Paste this code** in the Code node:

```javascript
const data = $input.first().json.data;
return {
  to: 'your-email@example.com',
  subject: `SEO Audit: ${data.domain} - ${data.overallScore}/100`,
  html: `
    <h2>Audit Complete</h2>
    <p><strong>Domain:</strong> ${data.domain}</p>
    <p><strong>Score:</strong> ${data.overallScore}/100</p>
    <ul>
      <li>Critical Issues: ${data.criticalIssues}</li>
      <li>High Issues: ${data.highIssues}</li>
    </ul>
  `
};
```

4. **Add Email node**
   - Click "+" after Code node
   - Search for "Send Email" (Gmail, SendGrid, etc.)
   - Connect your email service
   - Map fields from Code node

5. **Test the workflow**
   - Click "Test workflow"
   - You should receive an email

### Example 2: Slack Notification

1. **After webhook node**, add Code node:

```javascript
const score = $input.first().json.data.overallScore;
const color = score >= 80 ? '#36a64f' : '#ffa500';

return {
  text: `🔍 SEO Audit Complete`,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Domain:* ${$input.first().json.data.domain}\n*Score:* ${score}/100`
      }
    }
  ],
  attachments: [{
    color: color,
    fields: [
      { title: 'Critical', value: String($input.first().json.data.criticalIssues), short: true },
      { title: 'High', value: String($input.first().json.data.highIssues), short: true }
    ]
  }]
};
```

2. **Add Slack node**
   - Search for "Slack"
   - Select "Send a message"
   - Configure Slack credentials
   - Set channel (e.g., #seo-audits)

3. **Test and save**

### Example 3: Google Sheets Log

1. **After webhook node**, add Code node:

```javascript
const data = $input.first().json.data;
return {
  values: [[
    new Date().toISOString(),
    data.domain,
    data.overallScore,
    data.criticalIssues,
    data.highIssues,
    data.findingsCount
  ]]
};
```

2. **Add Google Sheets node**
   - Search for "Google Sheets"
   - Create spreadsheet with headers: Timestamp, Domain, Score, Critical, High, Findings
   - Configure node to append rows

## Step 5: Deploy and Test

1. **In n8n**: Click "Activate" (top right)
2. **In SEO Audit Pro**: 
   - Click the test button on your webhook
   - Verify the action completes (email sent, Slack message posted, etc.)
3. **Run a real audit** and watch the automation trigger!

## Real-World Example

### Setup Email + Slack + Sheets in One Workflow

1. Create one n8n workflow with webhook trigger
2. Add multiple nodes after webhook:
   - Code node → Email node
   - Code node → Slack node  
   - Code node → Google Sheets node

3. All three will execute simultaneously when audit completes

## API Reference

### Webhook Event Data

Every webhook sends this payload:

```json
{
  "event": "audit_complete",
  "timestamp": "2026-04-27T12:30:45.000Z",
  "data": {
    "auditId": "cuid-12345",
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

### Accessing Data in n8n

In Code nodes, access webhook data with:

```javascript
// Full payload
const payload = $input.first().json;

// Nested data
const domain = $input.first().json.data.domain;
const score = $input.first().json.data.overallScore;

// Specific scores
const technicalScore = $input.first().json.data.scores.technical;
const onPageScore = $input.first().json.data.scores.onPage;
```

## Troubleshooting

### Webhook Not Firing

**Problem**: Workflow never receives the webhook  
**Solution**:
1. Verify webhook URL is correct in SEO Audit Pro
2. Click test button in SEO Audit Pro - should work
3. Check n8n logs for incoming requests
4. Ensure workflow is activated

### Wrong Data in Workflow

**Problem**: Variables show undefined or wrong values  
**Solution**:
1. Use test button to send sample webhook
2. Click "Test workflow" in n8n
3. Check input data in each node (right side panel)
4. Debug code with `console.log()` statements

### Action Not Working (Email/Slack/etc)

**Problem**: Webhook fires but email/Slack/etc. doesn't send  
**Solution**:
1. Verify credentials are configured
2. Test the node independently (without webhook input)
3. Check n8n logs for error details
4. Ensure required fields are mapped

### Webhook Returns Error Status

**Problem**: Test webhook shows error  
**Solution**:
1. Check n8n instance is running
2. Verify URL is accessible (try opening in browser)
3. Check n8n logs for incoming request
4. Ensure webhook node is in "Listen" mode (not disabled)

## Advanced: Security

### Webhook Secrets

For production, always use secrets:

1. **In SEO Audit Pro**: Create webhook with secret
   - Enter a random string (e.g., use a password generator)
   - Save it somewhere safe

2. **In n8n**: Validate signature
   - Add Code node after webhook
   - Validate `X-Webhook-Signature` header:

```javascript
const crypto = require('crypto');
const signature = $input.first().headers['x-webhook-signature'];
const body = JSON.stringify($input.first().json);
const secret = 'your-secret-here';

const hmac = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

const expected = `sha256=${hmac}`;
const verified = signature === expected;

if (!verified) {
  throw new Error('Invalid signature');
}

return $input.first().json;
```

## Next Steps

- 📚 Read [N8N_INTEGRATION.md](N8N_INTEGRATION.md) for full API docs
- 🎨 Explore [n8n-examples](n8n-examples/) directory for more templates
- 🔗 Check n8n docs: https://docs.n8n.io/
- 💬 Join n8n community: https://community.n8n.io/

## Tips & Tricks

- **Multiple Webhooks**: Create different n8n workflows and register multiple webhooks in SEO Audit Pro
- **Conditional Logic**: Use "IF" nodes in n8n to run different actions based on score
- **Error Handling**: Add error handling nodes to send alerts if something fails
- **Rate Limiting**: n8n free tier allows reasonable usage; monitor for limits
- **Dry Run**: Use test button before running real audits
