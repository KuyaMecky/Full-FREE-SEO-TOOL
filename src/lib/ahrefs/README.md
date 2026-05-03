# Ahrefs Integration

This module provides Ahrefs API integration for domain analysis and audit reports.

## What's Available

### API Endpoints

**Client Library** (`client.ts`)
- `getAhrefsDomainMetrics(apiKey, domain)` — Fetch domain metrics (DR, traffic, keywords, backlinks)
- `getAhrefsBacklinks(apiKey, domain, limit)` — Fetch top referring domains with quality scores
- `calculateAhrefsScore(metrics)` — Generate 0-100 audit score
- `detectAhrefsIssues(metrics)` — Identify authority, visibility, and backlink gaps

**Audit Endpoint** (`/api/audit-ahrefs`)
- POST: Start Ahrefs audit for a property
- GET: Fetch audit history for current user

## How It Works

### 1. User Configuration
User adds Ahrefs API key in Settings → Integrations
- Key stored in `UserSettings.ahrefsApiKey`
- Safely encrypted in database

### 2. Audit Flow
1. User selects property and clicks "Run Audit" (Ahrefs option)
2. Endpoint validates user + API key
3. Calls Ahrefs API for domain metrics
4. Analyzes domain authority, backlinks, keyword visibility
5. Generates audit findings and KPIs
6. Saves report to database

### 3. Scoring Algorithm

Weighted scoring (0-100):
- **Domain Rating (30%)** — Authority level
  - 80+: +25pts, 60-80: +15pts, 40-60: +8pts
- **Referring Domains (25%)** — Backlink diversity
  - 500+: +20pts, 100-500: +12pts, 20-100: +6pts
- **Organic Keywords (25%)** — Keyword visibility
  - 1000+: +20pts, 300-1000: +12pts, 50-300: +6pts
- **Organic Traffic (20%)** — Organic visitor estimates
  - 10000+: +15pts, 1000-10000: +9pts, 100-1000: +4pts
- Base: 50 points

### 4. Issue Detection

Identifies these opportunities:
- **Low Authority** (DR < 20) → Build high-quality backlinks
- **Limited Backlinks** (Ref. domains < 20) → Develop outreach strategy
- **Low Keyword Visibility** (Keywords < 50) → Create optimized content
- **Low Traffic** (Organic traffic < 100) → Improve rankings
- **No Paid Search** → Consider PPC supplementation

## Requirements

- Ahrefs API key (from https://ahrefs.com)
- Paste in Settings → Integrations page (not yet implemented)

## API Specification

### getAhrefsDomainMetrics

```typescript
const metrics = await getAhrefsDomainMetrics(
  "your-ahrefs-api-key",
  "example.com"
);

// Returns:
{
  domain: "example.com",
  ahrefs_rank: 12345,           // Ahrefs global rank
  domain_rating: 45,             // Domain authority 0-100
  referring_domains: 150,        // Unique backlink sources
  backlinks: 3500,               // Total backlinks
  organic_keywords: 850,         // Ranking keywords
  organic_traffic: 12500,        // Monthly visitor estimate
  paid_keywords?: 45,            // Optional: PPC keywords
  paid_traffic?: 2000            // Optional: PPC traffic
}
```

### getAhrefsBacklinks

```typescript
const backlinks = await getAhrefsBacklinks(
  "your-ahrefs-api-key",
  "example.com",
  50  // limit
);

// Returns array of:
{
  url: "https://source.com/page",
  anchor_text: "best SEO tools",
  referring_url: "https://source.com/article",
  title: "Article Title",
  http_status: 200,
  link_type: "dofollow",
  domain_rating: 68
}
```

## Error Handling

- Invalid API key → Returns 400 "Ahrefs API key not configured"
- API quota exceeded → Returns 400 from Ahrefs API
- Domain not found → Returns empty/null metrics (gracefully handled)
- Network error → Logged, audit fails silently

## Next Steps

1. ✅ Ahrefs client library created
2. ✅ Audit endpoint implemented
3. ⏳ Settings UI to paste API key
4. ⏳ Test Ahrefs audit with real domain
5. ⏳ Compare results with Google audit

## Testing Checklist

- [ ] Configure Ahrefs API key in Settings
- [ ] Run audit on a property
- [ ] Verify audit completes and saves results
- [ ] Check audit score is between 0-100
- [ ] Verify findings include at least 1 issue
- [ ] Check report contains domain metrics
- [ ] Verify KPI targets are 30/60/90 day projections
