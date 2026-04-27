# n8n Webhook Troubleshooting Guide

Common issues and solutions for n8n webhook integration.

## Webhook Not Firing

### Symptoms
- Webhook never receives data
- n8n workflow doesn't trigger on audit completion
- No errors in SEO Audit Pro

### Diagnosis Steps

1. **Verify webhook is active**
   ```
   SEO Audit Pro → Settings → Webhooks
   Look for "Active" badge (green)
   ```

2. **Check webhook event type**
   ```
   Should be "audit_complete"
   ```

3. **Test webhook manually**
   ```
   Click play button (▶️) next to webhook
   Look for success message
   ```

4. **Check n8n webhook URL**
   ```
   In n8n → Webhook node
   Compare URL with SEO Audit Pro webhook list
   Must be exact match
   ```

5. **Check n8n logs**
   ```
   n8n UI → Execution history
   Look for incoming POST request from SEO Audit Pro
   Check timestamp matches your test
   ```

### Solutions

**Solution 1: Webhook URL mismatch**
- Copy exact URL from n8n webhook node again
- Delete old webhook in SEO Audit Pro
- Create new webhook with correct URL
- Test with play button

**Solution 2: n8n instance not running**
- Verify n8n is started
- Check n8n URL is accessible (try in browser)
- For self-hosted: check Docker/PM2 status

**Solution 3: Firewall/Network blocking**
- Check if n8n URL is accessible from SEO Audit Pro server
- For local n8n: use ngrok to create public URL
- For Vercel deployment: ensure outbound HTTPS allowed

**Solution 4: Webhook node not in listen mode**
- In n8n workflow: click Webhook node
- Look for "Start listening to webhooks" button
- May need to redeploy workflow

**Solution 5: Wrong event type**
- In SEO Audit Pro: create new webhook
- Select "audit_complete" from event dropdown
- Not "findings_generated" or other events

---

## n8n Not Receiving Data

### Symptoms
- Webhook fires (success message)
- n8n workflow triggers
- But workflow input shows empty/no data

### Diagnosis

1. **Test webhook sends data**
   ```
   SEO Audit Pro → Click test button
   Check success message appears
   ```

2. **Check n8n execution input**
   ```
   n8n → View execution
   Webhook node → Check input data panel
   Should show event, timestamp, data object
   ```

3. **Verify n8n workflow is activated**
   ```
   n8n top right corner
   Should show "Active" toggle is ON
   ```

### Solutions

**Solution 1: Webhook node not configured**
- In n8n: click Webhook node
- Verify method is "POST"
- Verify "Listen" checkbox is enabled

**Solution 2: Workflow not activated**
- Click "Activate" button (top right)
- Status should show "Active"
- Re-test with play button

**Solution 3: Wrong trigger node type**
- Check using "Webhook" node (not "Webhook Trigger")
- Should be under "Triggers" section
- Not "Helper" or other categories

**Solution 4: Test data not matching structure**
```javascript
// Expected structure in n8n
{
  "event": "audit_complete",
  "timestamp": "2026-04-27T12:30:45.000Z",
  "data": {
    "auditId": "...",
    "domain": "...",
    "overallScore": 85,
    "scores": { ... },
    "findingsCount": 15,
    "criticalIssues": 2,
    "highIssues": 5
  }
}

// In Code node, access like:
const domain = $input.first().json.data.domain;
const score = $input.first().json.data.overallScore;
```

---

## Action Not Executing (Email/Slack/etc)

### Symptoms
- Webhook fires successfully
- n8n workflow runs
- But email not sent / Slack message not posted / etc

### Diagnosis

1. **Check n8n execution logs**
   ```
   n8n → Execution view
   Click on each node to see output
   Look for error messages
   ```

2. **Test action node independently**
   ```
   In n8n: right-click Email/Slack node
   Select "Test step"
   Without webhook input (use sample data)
   Should work if credentials are correct
   ```

3. **Verify credentials configured**
   ```
   Email node → look for red error badge
   Should show "Gmail connected" or similar
   If missing: configure credentials
   ```

4. **Check node input data**
   ```
   Right-click node → "View output"
   Previous node in chain should show data
   Verify fields are being passed correctly
   ```

### Solutions

**Solution 1: Missing credentials**
- Email node → Click "Create new" credential
- Follow OAuth/login flow
- Select correct email service (Gmail, SendGrid, etc)

**Solution 2: Incorrect field mapping**
- Check Code node outputs correct structure
- Email node expects: `to`, `subject`, `html`
- Slack node expects: `channel`, `text`, `attachments`
- Verify each field is mapped from Code node output

**Solution 3: Code node error**
```javascript
// Test code with console.log
console.log('Input:', $input.first().json.data);
console.log('Domain:', $input.first().json.data.domain);

// Code node should return expected structure
return {
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test</p>'
};
```

**Solution 4: Required fields missing**
- Email node requires: `to`, `subject`, `html`
- Slack node requires: `channel`, `text`
- Check Code node returns all required fields

**Solution 5: API rate limits**
- Email: check service rate limits (Gmail: 300 per day free)
- Slack: check workspace rate limits
- Monitor n8n execution logs for 429 errors

---

## Webhook Disabled After Failures

### Symptoms
- Webhook was working
- Suddenly shows "Inactive" badge
- Fail count shows 10+

### Causes
- n8n instance went down
- n8n webhook URL became inaccessible
- Network connectivity issues
- Recurring error in n8n workflow

### Solutions

**Solution 1: Restart n8n**
1. Stop n8n service
2. Restart n8n
3. In SEO Audit Pro: Re-enable webhook
4. Click test button to verify

**Solution 2: Check n8n logs**
- Review n8n application logs
- Look for errors around the time of failures
- Fix underlying issue (permission, API key, etc)

**Solution 3: Review workflow**
1. In n8n: open workflow
2. Check for error nodes (red X)
3. Fix node configurations
4. Re-test

**Solution 4: Re-enable webhook**
- SEO Audit Pro → Settings → Webhooks
- Find disabled webhook
- Toggle Active switch to re-enable
- Click test button

---

## Webhook Shows Error Message

### Symptoms
- "Last Error" field shows message
- Fail count incrementing
- Error message is unclear

### Common Error Messages

**"HTTP 404: Not Found"**
- Webhook URL doesn't exist
- n8n instance URL is wrong
- Workflow was deleted

**Fix**: Verify n8n URL and workflow exist

**"HTTP 403: Forbidden"**
- n8n requires authentication
- CORS policy blocking request
- Firewall rule blocking

**Fix**: 
- Check n8n security settings
- Ensure webhook is public (not authenticated)
- Check firewall rules

**"HTTP 500: Internal Server Error"**
- n8n workflow has error
- Node configuration invalid
- Code syntax error

**Fix**:
1. Check n8n logs
2. Review workflow nodes
3. Fix any errors
4. Re-test

**"Timeout"**
- n8n taking too long to respond
- Network latency high
- n8n process slow

**Fix**:
- Check n8n performance
- Simplify workflow
- Check network latency

**"Connection refused"**
- n8n not running
- n8n on wrong port
- Firewall blocking

**Fix**:
- Verify n8n running
- Check URL is correct
- Verify network/firewall

---

## HMAC Signature Issues

### Symptoms
- Webhook fires but n8n rejects data
- "Invalid signature" error
- Signature verification fails

### Diagnosis

1. **Check if secret was used**
   ```
   SEO Audit Pro → Webhook details
   If "Secret" field is empty: no HMAC verification needed
   If "Secret" field has value: n8n must verify
   ```

2. **Verify n8n has verification code**
   ```
   n8n → Code node after webhook
   Should include HMAC validation
   Must use same secret as SEO Audit Pro
   ```

### Solutions

**Solution 1: No secret set (easiest)**
- If you don't need security: don't set secret
- Webhook will work without verification
- Remove verification code from n8n

**Solution 2: Secret mismatch**
- Get secret from SEO Audit Pro webhook
- Update n8n Code node with same secret
- Both must match exactly

**Solution 3: Verify implementation**
```javascript
// Correct verification in n8n
const crypto = require('crypto');

const signature = $input.first().headers['x-webhook-signature'];
const body = JSON.stringify($input.first().json);
const secret = 'your-secret-from-seo-audit-pro'; // MUST match

const hmac = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

const expected = `sha256=${hmac}`;

if (signature !== expected) {
  throw new Error('Invalid signature');
}

return $input.first().json;
```

**Solution 4: Headers not included**
- Check webhook node received headers
- In n8n: click webhook node → "View input"
- Should show `x-webhook-signature` header
- If missing: likely issue with n8n version

---

## Performance Issues

### Symptoms
- Webhooks firing but very slow
- n8n workflow takes long time
- Multiple webhooks creating delays

### Solutions

**Solution 1: Simplify workflow**
- Remove unnecessary nodes
- Remove complex Code logic
- Combine multiple operations

**Solution 2: Check n8n resources**
- CPU usage high?
- Memory usage high?
- Too many workflows running?

**Solution 3: Optimize Code node**
```javascript
// ❌ Slow: processing inside Code node
for (let i = 0; i < 1000; i++) {
  // heavy processing
}

// ✅ Fast: only extract needed data
return {
  domain: $input.first().json.data.domain,
  score: $input.first().json.data.overallScore
};
```

**Solution 4: Parallel workflows**
- Instead of one complex workflow
- Create multiple simpler workflows
- Register multiple webhooks in SEO Audit Pro
- Each fires in parallel

---

## Getting Help

If issue not listed above:

1. **Check n8n logs**
   ```
   n8n UI → Execution history
   Review full execution trace
   Look for specific error details
   ```

2. **Test with curl**
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/uuid \
     -H "Content-Type: application/json" \
     -d '{
       "event": "audit_complete",
       "timestamp": "2026-04-27T12:00:00.000Z",
       "data": {
         "domain": "example.com",
         "overallScore": 85
       }
     }'
   ```

3. **Enable n8n debug mode**
   ```bash
   # For self-hosted n8n
   DEBUG=n8n* npm start
   ```

4. **Review recent changes**
   - Did you update n8n version?
   - Did you change webhook URL?
   - Did you modify n8n workflow?
   - Did credentials expire?

5. **Contact n8n support**
   - n8n community: https://community.n8n.io/
   - n8n docs: https://docs.n8n.io/
   - n8n support: https://n8n.io/support

---

## Quick Checklist

Before reporting issue, verify:

- [ ] Webhook is marked "Active"
- [ ] Event is "audit_complete"
- [ ] n8n URL is exact match
- [ ] n8n instance is running
- [ ] n8n URL accessible from SEO Audit Pro server
- [ ] n8n workflow is activated
- [ ] Test button shows success
- [ ] n8n logs show incoming request
- [ ] Node credentials are configured
- [ ] Code node returns correct structure
- [ ] No 10+ failures (webhook auto-disabled)

If all above checked: [open GitHub issue](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/issues)

---

**Last Updated**: 2026-04-27  
**Version**: 1.0  
For latest docs: https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/docs/
