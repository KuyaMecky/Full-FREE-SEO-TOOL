# SEO Audit Pro - Complete API Reference

Official API documentation for SEO Audit Pro. Integrate enterprise-grade SEO analysis into your applications.

**Live API**: https://full-free-seo-tool.vercel.app  
**Status Page**: https://status.example.com  
**Support**: support@example.com

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Examples](#examples)
8. [Webhooks](#webhooks)
9. [SDKs](#sdks)

---

## Getting Started

### Prerequisites

- A free account at https://full-free-seo-tool.vercel.app
- An API key (generate in Settings → Developer)

### API Base URL

```
https://full-free-seo-tool.vercel.app/api/public
```

### Quick Test

```bash
curl -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

---

## Authentication

All API requests require authentication via Bearer token.

### Header Format

```
Authorization: Bearer YOUR_API_KEY
```

### Example Request

```bash
curl https://full-free-seo-tool.vercel.app/api/public/audits/my-audit-id \
  -H "Authorization: Bearer seo_abcd1234_xyz789abc123def456ghi789jkl012mno345"
```

### Error: Missing API Key

```json
{
  "error": "Missing or invalid API key. Use: Authorization: Bearer YOUR_API_KEY"
}
```

### Error: Invalid API Key

```json
{
  "error": "Missing or invalid API key. Use: Authorization: Bearer YOUR_API_KEY"
}
```

---

## Rate Limiting

### Limits by Plan

| Plan | Requests/Month | Concurrent Audits | Response Time |
|------|---|---|---|
| **Free** | 50 | 5 | 15s average |
| **Pro** | Unlimited | 20 | 10s average |
| **Enterprise** | Custom | Custom | Custom SLA |

### Rate Limit Headers

Every response includes headers indicating your usage:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1704067200
```

### Handling Rate Limits

When you hit the limit, you'll get a 429 response:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

**Solution:** Retry after the `retryAfter` seconds.

---

## API Endpoints

### 1. Create Audit

Start a new website audit.

**Endpoint**
```
POST /api/public/audits/create
```

**Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `domain` | string | Yes | Website domain (e.g., example.com) |
| `maxPages` | integer | No | Max pages to crawl (1-500, default: 50) |

**Request**

```bash
curl -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "maxPages": 100
  }'
```

**Response (201 Created)**

```json
{
  "auditId": "audit_1704067200_abc123def456",
  "domain": "example.com",
  "status": "pending",
  "createdAt": "2024-01-01T12:00:00Z",
  "resultsUrl": "https://full-free-seo-tool.vercel.app/api/public/audits/audit_1704067200_abc123def456"
}
```

**Errors**

| Status | Error | Solution |
|--------|-------|----------|
| 400 | `domain is required` | Include domain in request body |
| 400 | `Invalid domain format` | Use format: example.com (no https://) |
| 400 | `maxPages must be between 1 and 500` | Set maxPages within range |
| 401 | `Missing or invalid API key` | Check Authorization header |
| 429 | `Rate limit exceeded` | Wait before retrying |

---

### 2. Get Audit Results

Fetch completed audit results.

**Endpoint**
```
GET /api/public/audits/{auditId}
```

**Parameters**

| Name | Type | Required | Location | Description |
|------|------|----------|----------|-------------|
| `auditId` | string | Yes | URL path | Audit ID from create response |

**Request**

```bash
curl https://full-free-seo-tool.vercel.app/api/public/audits/audit_1704067200_abc123def456 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response (200 OK)**

```json
{
  "id": "audit_1704067200_abc123def456",
  "domain": "example.com",
  "status": "complete",
  "overallScore": 78,
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:05:30Z",
  "pagesAnalyzed": 42,
  "crawlResults": [
    {
      "url": "https://example.com",
      "statusCode": 200,
      "title": "Welcome to Example",
      "metaDescription": "Example website description",
      "h1": "Welcome",
      "wordCount": 1250,
      "responseTime": 145,
      "issues": []
    }
  ]
}
```

**Status Values**

| Status | Meaning | Next Action |
|--------|---------|------------|
| `pending` | Queued, waiting to start | Retry in 10 seconds |
| `crawling` | Currently crawling website | Retry in 5-10 seconds |
| `analyzing` | Processing crawl results | Retry in 5 seconds |
| `complete` | Finished, results ready | Process results |
| `error` | Crawl failed | Check error details |

**Errors**

| Status | Error | Solution |
|--------|-------|----------|
| 401 | `Missing or invalid API key` | Check Authorization header |
| 403 | `Unauthorized` | You don't own this audit |
| 404 | `Audit not found` | Check auditId |

---

## Data Models

### Audit Object

```json
{
  "id": "audit_1704067200_abc123def456",
  "domain": "example.com",
  "status": "complete",
  "overallScore": 78,
  "pagesAnalyzed": 42,
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:05:30Z",
  "crawlResults": [...]
}
```

### CrawlResult Object

```json
{
  "url": "https://example.com/page",
  "statusCode": 200,
  "title": "Page Title",
  "metaDescription": "Page description",
  "h1": "Main Heading",
  "wordCount": 1250,
  "responseTime": 145,
  "issues": [
    "Missing meta description",
    "Low internal links"
  ]
}
```

### Error Object

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Fix request parameters |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check resource ID |
| 429 | Too Many Requests | Wait and retry |
| 500 | Server Error | Try again later |

### Retry Logic

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.retryAfter || Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, retryAfter));
      } else if (error.status >= 500 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Examples

### JavaScript/Node.js

```javascript
const API_KEY = 'your_api_key_here';
const API_URL = 'https://full-free-seo-tool.vercel.app/api/public';

class SEOAuditClient {
  async createAudit(domain, maxPages = 50) {
    const response = await fetch(`${API_URL}/audits/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domain, maxPages })
    });

    if (!response.ok) {
      throw new Error(`Audit creation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAudit(auditId) {
    const response = await fetch(`${API_URL}/audits/${auditId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit: ${response.statusText}`);
    }

    return await response.json();
  }

  async waitForCompletion(auditId, maxWait = 300000) {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWait) {
      const audit = await this.getAudit(auditId);

      if (audit.status === 'complete') {
        return audit;
      }

      if (audit.status === 'error') {
        throw new Error('Audit failed');
      }

      console.log(`Status: ${audit.status}...`);
      await new Promise(r => setTimeout(r, pollInterval));
    }

    throw new Error('Audit timeout');
  }

  async auditAndWait(domain) {
    const { auditId } = await this.createAudit(domain);
    console.log(`Audit created: ${auditId}`);
    const results = await this.waitForCompletion(auditId);
    return results;
  }
}

// Usage
const client = new SEOAuditClient();
const results = await client.auditAndWait('example.com');
console.log(`Score: ${results.overallScore}/100`);
console.log(`Pages: ${results.pagesAnalyzed}`);
```

### Python

```python
import requests
import time

class SEOAuditClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://full-free-seo-tool.vercel.app/api/public'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def create_audit(self, domain, max_pages=50):
        response = requests.post(
            f'{self.base_url}/audits/create',
            headers=self.headers,
            json={'domain': domain, 'maxPages': max_pages}
        )
        response.raise_for_status()
        return response.json()

    def get_audit(self, audit_id):
        response = requests.get(
            f'{self.base_url}/audits/{audit_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def wait_for_completion(self, audit_id, max_wait=300):
        start_time = time.time()
        poll_interval = 2

        while time.time() - start_time < max_wait:
            audit = self.get_audit(audit_id)

            if audit['status'] == 'complete':
                return audit

            if audit['status'] == 'error':
                raise Exception('Audit failed')

            print(f"Status: {audit['status']}...")
            time.sleep(poll_interval)

        raise Exception('Audit timeout')

    def audit_and_wait(self, domain):
        result = self.create_audit(domain)
        audit_id = result['auditId']
        print(f'Audit created: {audit_id}')
        return self.wait_for_completion(audit_id)

# Usage
client = SEOAuditClient('your_api_key_here')
results = client.audit_and_wait('example.com')
print(f"Score: {results['overallScore']}/100")
print(f"Pages: {results['pagesAnalyzed']}")
```

### cURL

```bash
#!/bin/bash

API_KEY="your_api_key_here"
DOMAIN="example.com"

# Create audit
echo "Creating audit for $DOMAIN..."
AUDIT=$(curl -s -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"$DOMAIN\"}")

AUDIT_ID=$(echo $AUDIT | jq -r '.auditId')
echo "Audit ID: $AUDIT_ID"

# Wait for completion
while true; do
  RESULT=$(curl -s https://full-free-seo-tool.vercel.app/api/public/audits/$AUDIT_ID \
    -H "Authorization: Bearer $API_KEY")

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

## Webhooks

Subscribe to audit events.

### Event Types

```
audit.created    - New audit started
audit.completed  - Audit finished
audit.failed     - Audit error
```

### Register Webhook

```bash
POST /api/webhooks
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://your-app.com/webhooks/seo-audit",
  "event": "audit.completed",
  "secret": "optional_secret_for_hmac"
}
```

### Webhook Payload

```json
{
  "event": "audit.completed",
  "auditId": "audit_1704067200_abc123def456",
  "timestamp": "2024-01-01T12:05:30Z",
  "data": {
    "domain": "example.com",
    "overallScore": 78,
    "pagesAnalyzed": 42
  }
}
```

---

## SDKs

### Official SDKs

- **JavaScript/Node.js**: `npm install seo-audit-api`
- **Python**: `pip install seo-audit-api`
- **Go**: `go get github.com/kuyamecky/seo-audit-api-go`

### Community SDKs

- **Ruby**: [ruby-seo-audit](https://github.com/user/ruby-seo-audit)
- **PHP**: [php-seo-audit](https://github.com/user/php-seo-audit)

---

## FAQ

**Q: How long does an audit take?**  
A: Average 2-5 minutes depending on site size. Maximum 15 minutes.

**Q: Can I cancel an audit?**  
A: Not currently, but you can ignore the results.

**Q: What if a domain has redirects?**  
A: We follow up to 5 redirects automatically.

**Q: Is there a staging environment?**  
A: Not yet, coming soon. For now, use low `maxPages` for testing.

**Q: Can I get historical data?**  
A: Audits are available for 30 days after creation.

**Q: Do you support subdomains?**  
A: Yes, specify: `subdomain.example.com`

---

## Changelog

### v1.0.0 - 2024-01-01
- Initial API release
- Create audits endpoint
- Get results endpoint
- API key authentication
- Rate limiting (50 audits/month free)

---

## Support

- **Email**: support@example.com
- **GitHub**: https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/issues
- **Discord**: [Join Community](https://discord.gg/example)

---

Generated: 2024-01-01 | Last Updated: 2024-01-01
