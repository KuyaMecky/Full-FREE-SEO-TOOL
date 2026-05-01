# SEO Audit Function - Complete Debug Guide

## Overview
The audit function analyzes websites for SEO issues. You reported it was timing out because it **wasn't actually auditing** - it was generating fake data.

---

## 1️⃣ WHERE THE REAL CRAWLER CODE IS LOCATED

### Architecture
```
src/
├── app/
│   └── api/
│       ├── crawl/
│       │   ├── route.ts          ← FIXED: Now uses real crawlWebsite()
│       │   └── progress/route.ts  ← SSE stream for real-time progress
│       ├── analyze/
│       │   └── route.ts          ← Analyzes crawl results
│       └── audit/
│           └── route.ts          ← Creates audit record
└── lib/
    ├── crawler/
    │   ├── index.ts              ← crawlWebsite() function
    │   ├── fetcher.ts            ← Fetches actual web pages
    │   ├── types.ts              ← TypeScript interfaces
    │   └── analyzers/            ← SEO analysis modules
    │       ├── meta.ts           ← Title, description, canonical
    │       ├── headings.ts       ← H1-H6 structure
    │       ├── links.ts          ← Internal/external links
    │       ├── images.ts         ← Alt text, dimensions
    │       ├── structured-data.ts ← JSON-LD, microdata
    │       ├── security.ts       ← HTTPS, headers
    │       ├── performance.ts    ← Page speed metrics
    │       ├── robots.ts         ← robots.txt parsing
    │       └── sitemap.ts        ← Sitemap discovery
    └── crawl-store.ts            ← In-memory progress tracking
```

---

## 2️⃣ HOW THE REAL CRAWLER WORKS (Implementation)

### Audit Flow - Before (Broken ❌)
```
1. POST /api/audit          → Create audit record
2. POST /api/crawl          → START MOCK CRAWL
   └─ (async) generateMockCrawlResults()  ← Fake data generator
      ├─ Generate 10-30 fake pages
      ├─ Fake metadata: titles, descriptions
      ├─ Fake issues randomly generated
      └─ No actual website fetching
3. SSE /api/crawl/progress  → Show fake progress
4. POST /api/analyze        → Analyze fake results
5. Result: Timeout at 10 minutes waiting for real data
```

### Audit Flow - After (Fixed ✅)
```
1. POST /api/audit              → Create audit record
2. POST /api/crawl              → START REAL CRAWL
   └─ (async) startCrawlBackground()
      ├─ Parse domain: https://example.com
      ├─ Fetch robots.txt & sitemap
      ├─ Queue base URL + sitemap URLs
      └─ crawlWebsite(domain, options, onProgress)
         ├─ CONCURRENT CRAWLING (3 pages at a time)
         │  ├─ fetchPage()           → Actual HTTP request
         │  ├─ Parse HTML with Cheerio
         │  ├─ Run all analyzers:
         │  │  ├─ analyzeMeta()      → Title, desc, canonical
         │  │  ├─ analyzeHeadings()  → H1-H6 structure issues
         │  │  ├─ analyzeLinks()     → Check internal/external
         │  │  ├─ analyzeImages()    → Missing alt text
         │  │  ├─ analyzeStructuredData() → JSON-LD
         │  │  ├─ analyzeSecurity()  → HTTPS, headers
         │  │  └─ analyzePerformance() → Response time
         │  └─ Extract: title, meta, headings, links, images, etc.
         ├─ UPDATE PROGRESS in DB + in-memory
         └─ RESPECT robots.txt + rate limits
3. SSE /api/crawl/progress      → Real progress streamed
4. Save CrawlResult rows        → Database contains actual data
5. POST /api/analyze            → Real analysis of real data
6. Result: Full audit with real findings
```

### Real Crawler - Key Functions

#### `crawlWebsite(domain, options, onProgress)`
```typescript
// src/lib/crawler/index.ts:25
export async function crawlWebsite(
  domain: string,
  options: Partial<CrawlOptions> = {},
  onProgress?: (progress: CrawlProgress) => void
): Promise<{
  results: PageAnalysis[];  // Real crawl data for each page
  errors: string[];          // Network/fetch errors
  robotsData: {...};
  sitemapUrls: string[];
}>
```

What it does:
1. Normalizes domain: "example.com" → "https://example.com"
2. Fetches `robots.txt` and discovers `sitemap.xml`
3. Seeds URL queue with domain + sitemap URLs
4. Crawls concurrently (3 pages at a time by default)
5. For each page:
   - `fetchPage()` - Makes actual HTTP request
   - Parses HTML with Cheerio
   - Runs 7 SEO analyzers
   - Extracts metadata + detects issues
   - Reports progress via callback
6. Respects robots.txt and rate limits
7. Returns real page analysis data

#### `fetchPage(url, options)`
```typescript
// src/lib/crawler/fetcher.ts:11
async function fetchPage(url, options): Promise<{
  html: string;        // Actual page content
  statusCode: number;  // HTTP status
  responseTime: number; // Milliseconds
  contentLength: number; // Bytes
  error?: string;      // If failed
}>
```

What it does:
1. Makes actual HTTP GET request
2. Sets proper User-Agent header
3. Follows redirects (301, 302)
4. 60-second timeout per page
5. Checks Content-Type is HTML
6. Returns page content + metrics

#### Analyzers (src/lib/crawler/analyzers/)
Each analyzer looks for specific SEO issues:

| Analyzer | Checks |
|----------|--------|
| `meta.ts` | Title length, meta description, canonical URL |
| `headings.ts` | Missing H1, multiple H1s, improper hierarchy |
| `links.ts` | Broken links, nofollow, external/internal ratio |
| `images.ts` | Missing alt text, dimensions, loading attributes |
| `structured-data.ts` | JSON-LD, microdata, missing schema |
| `security.ts` | HTTPS, security headers |
| `performance.ts` | Response time, file size, page bloat |

---

## 3️⃣ DEBUG THE FLOW - How to Troubleshoot

### Check 1: Is the crawl actually starting?
```bash
# Look at server logs during audit
# You should see:
# ✅ "Starting real crawl for domain: example.com"
# ❌ If missing: crawl route not being called
```

### Check 2: Is the domain reachable?
```bash
# Test if the domain can be fetched
curl -I https://example.com

# If it fails:
# - Check domain spelling
# - Network connectivity
# - Domain firewall/protection
# - DNS resolution
```

### Check 3: Check database for crawl results
```sql
-- After audit completes, check if CrawlResults were saved
SELECT COUNT(*) FROM "CrawlResult" WHERE "auditId" = 'audit-id-here';
-- Should see actual page count (not 0)

-- Check actual URL data
SELECT url, "statusCode", title FROM "CrawlResult" 
WHERE "auditId" = 'audit-id-here' 
LIMIT 5;
```

### Check 4: Monitor progress in real-time
```bash
# In browser DevTools → Network tab:
# 1. Start an audit
# 2. Find /api/crawl/progress request
# 3. In Response tab, watch Server-Sent Events
#    Should see: {"crawledPages": 1, "totalPages": N, "currentUrl": "...", ...}
#    Incrementing crawledPages means it's working
```

### Check 5: Database - Check audit flow
```sql
-- Track audit through pipeline:
SELECT 
  id, 
  domain, 
  status,  -- pending → crawling → complete → error?
  "createdAt",
  "errorMessage"
FROM "Audit" 
WHERE domain = 'example.com'
ORDER BY "createdAt" DESC;

-- Check if findings were generated
SELECT COUNT(*) FROM "Finding" WHERE "auditId" = 'audit-id';
-- Should have > 0 if crawl succeeded

-- Check if analysis completed
SELECT COUNT(*) FROM "AuditReport" WHERE "auditId" = 'audit-id';
-- Should have 1 row if analysis succeeded
```

### Check 6: Look at error messages
```sql
-- If audit failed, see the error
SELECT "errorMessage" FROM "Audit" 
WHERE id = 'audit-id-here';

-- Check crawl errors
SELECT "crawlProgress" FROM "Audit" 
WHERE id = 'audit-id-here';
-- Look for "errors" array in JSON
```

### Common Issues & Fixes

#### Issue 1: "No crawl results found" in analyze endpoint
**Cause**: CrawlResult rows weren't created  
**Fix**: 
- Check if domain exists and is reachable
- Check GCS property is connected (new requirement)
- Check server logs for fetch errors

#### Issue 2: Analysis never triggers
**Cause**: Background crawl might have crashed silently  
**Fix**:
- Check Audit table for status = "error"
- Check errorMessage column
- Look at server console logs during crawl

#### Issue 3: SSE timeout (10 minutes)
**Cause**: Real crawl takes longer than expected  
**Fix**:
- Reduce maxPages setting
- Check domain response times: `curl -w '%{time_total}\n' https://example.com`
- If > 60s per page, crawler will skip that page
- Check for site rate limiting (blocks crawlers)

#### Issue 4: Domain returns 403/401
**Cause**: Site blocks SEO crawlers  
**Fix**:
- User-Agent is: `SEO-Audit-Bot/1.0 (https://github.com/seo-audit-bot)`
- Some sites block this; contact site owner or use IP whitelist
- Check site's robots.txt for restrictions

---

## Testing the Fix

### Local Testing
```bash
# 1. Start dev server
npm run dev

# 2. In browser:
# - Go to http://localhost:3000/audit/new
# - Ensure GCS property is connected
# - Select a domain you own
# - Click "Start SEO Audit"

# 3. Watch terminal for:
# ✅ "Starting real crawl for domain: example.com"
# ✅ "Crawl completed: X pages, Y errors"
# ✅ "Analysis triggered successfully"

# 4. Check audit results after ~30-60 seconds
# Should show actual page data + findings
```

### Verifying Real Data
After audit completes, check audit detail page:
- Pages crawled should match your actual site structure
- Titles/descriptions should be your actual content (not fake)
- Issues found should be real (missing meta, broken links, etc.)

---

## Summary

| Aspect | Before ❌ | After ✅ |
|--------|---------|-------|
| Crawling | Mock data generator | Real HTTP requests |
| Pages | Fake 10-30 random pages | Actual site pages |
| Metadata | Random generated | Extracted from HTML |
| Issues | Random generated | Detected by 7 analyzers |
| Analysis | Guessed findings | Real data analysis |
| Timeout | 10 minute wait for nothing | Real crawl + analysis |

The audit function now actually works! 🎉
