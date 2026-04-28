# SEO Audit Pro - Public API

Your SEO Audit Pro app now has a **public API** that other applications can integrate with.

**Base URL**: `https://full-free-seo-tool.vercel.app`

## Getting Started

### 1. Generate API Key

Go to https://full-free-seo-tool.vercel.app/settings → API Keys → Generate Key

Copy your API key (keep it secret!)

### 2. Make API Calls

Include your API key in the `Authorization` header:

```bash
Authorization: Bearer YOUR_API_KEY_HERE
```

## API Endpoints

### 1. Create Audit

**Endpoint**: `POST /api/public/audits/create`

Start a new website audit.

**Request:**
```bash
curl -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "maxPages": 50
  }'
```

**Parameters:**
- `domain` (required) - Website domain (e.g., example.com)
- `maxPages` (optional) - Max pages to crawl (1-500, default: 50)

**Response:**
```json
{
  "auditId": "audit_123456",
  "domain": "example.com",
  "status": "pending",
  "createdAt": "2026-04-28T12:00:00Z",
  "resultsUrl": "https://full-free-seo-tool.vercel.app/api/public/audits/audit_123456"
}
```

---

### 2. Get Audit Results

**Endpoint**: `GET /api/public/audits/:auditId`

Fetch audit results once complete.

**Request:**
```bash
curl https://full-free-seo-tool.vercel.app/api/public/audits/audit_123456 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "id": "audit_123456",
  "domain": "example.com",
  "status": "complete",
  "overallScore": 78,
  "createdAt": "2026-04-28T12:00:00Z",
  "completedAt": "2026-04-28T12:05:00Z",
  "pagesAnalyzed": 42,
  "crawlResults": [
    {
      "url": "https://example.com",
      "statusCode": 200,
      "title": "Welcome",
      "metaDescription": "Example site",
      "h1": "Welcome to Example",
      "wordCount": 1200,
      "responseTime": 145,
      "issues": []
    }
  ]
}
```

**Status Values:**
- `pending` - Audit queued
- `crawling` - Currently crawling website
- `analyzing` - Analyzing results
- `complete` - Audit finished
- `error` - Audit failed

---

## Code Examples

### JavaScript/Node.js

```javascript
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://full-free-seo-tool.vercel.app';

async function auditWebsite(domain) {
  // Create audit
  const createRes = await fetch(`${BASE_URL}/api/public/audits/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain, maxPages: 50 })
  });
  
  const { auditId } = await createRes.json();
  console.log('Audit created:', auditId);
  
  // Poll for results
  let audit;
  do {
    const res = await fetch(`${BASE_URL}/api/public/audits/${auditId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    audit = await res.json();
    
    if (audit.status !== 'complete') {
      console.log(`Status: ${audit.status}...`);
      await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
    }
  } while (audit.status !== 'complete');
  
  return audit;
}

// Usage
auditWebsite('example.com').then(results => {
  console.log('Audit complete!');
  console.log(`Score: ${results.overallScore}/100`);
  console.log(`Pages: ${results.pagesAnalyzed}`);
});
```

### Python

```python
import requests
import time

API_KEY = 'your_api_key_here'
BASE_URL = 'https://full-free-seo-tool.vercel.app'

def audit_website(domain):
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    # Create audit
    res = requests.post(
        f'{BASE_URL}/api/public/audits/create',
        headers=headers,
        json={'domain': domain, 'maxPages': 50}
    )
    audit_id = res.json()['auditId']
    print(f'Audit created: {audit_id}')
    
    # Poll for results
    while True:
        res = requests.get(
            f'{BASE_URL}/api/public/audits/{audit_id}',
            headers=headers
        )
        audit = res.json()
        
        if audit['status'] == 'complete':
            return audit
        
        print(f"Status: {audit['status']}...")
        time.sleep(2)

# Usage
results = audit_website('example.com')
print(f"Score: {results['overallScore']}/100")
print(f"Pages: {results['pagesAnalyzed']}")
```

### cURL

```bash
# Create audit
AUDIT=$(curl -s -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com"}')

AUDIT_ID=$(echo $AUDIT | jq -r '.auditId')
echo "Audit ID: $AUDIT_ID"

# Wait for completion
while true; do
  RESULT=$(curl -s https://full-free-seo-tool.vercel.app/api/public/audits/$AUDIT_ID \
    -H "Authorization: Bearer YOUR_API_KEY")
  
  STATUS=$(echo $RESULT | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "complete" ]; then
    echo $RESULT | jq '.'
    break
  fi
  
  sleep 2
done
```

---

## Integration Examples

### WordPress Plugin

Display SEO scores on posts:

```php
<?php
function get_seo_score($domain) {
    $api_key = get_option('seo_api_key');
    
    $response = wp_remote_post('https://full-free-seo-tool.vercel.app/api/public/audits/create', [
        'headers' => [
            'Authorization' => "Bearer $api_key",
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode([
            'domain' => $domain,
            'maxPages' => 10
        ])
    ]);
    
    return json_decode(wp_remote_retrieve_body($response));
}
?>
```

### Slack Bot

Send SEO audit results to Slack:

```javascript
// In your Slack app
app.command('/audit', async ({ command, ack, say }) => {
  await ack();
  
  const domain = command.text;
  const results = await auditWebsite(domain);
  
  await say({
    text: `SEO Audit: ${domain}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*SEO Score: ${results.overallScore}/100*\nPages: ${results.pagesAnalyzed}`
        }
      }
    ]
  });
});
```

---

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "error": "Missing or invalid API key"
}
```
Solution: Check your API key is correct

**400 Bad Request**
```json
{
  "error": "domain is required"
}
```
Solution: Check all required fields are provided

**404 Not Found**
```json
{
  "error": "Audit not found"
}
```
Solution: Check the auditId is correct

---

## Rate Limits

- **Free Plan**: 50 audits/month
- **Pro Plan**: Unlimited audits (coming soon)

---

## Support

- Documentation: This file
- Issues: GitHub issues
- Email: support@example.com

---

## Changelog

### v1.0 (2026-04-28)
- Initial public API release
- Create audits endpoint
- Get results endpoint
- API key authentication
