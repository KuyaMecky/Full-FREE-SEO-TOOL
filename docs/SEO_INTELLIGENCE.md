# SEO Intelligence Platform

Complete free SEO intelligence system for competing with Ahrefs and SEMrush using only open-source APIs.

## Overview

The SEO Intelligence Dashboard provides 4 core modules:

1. **Keyword Research** - Find opportunities from Google Search Console data
2. **Content Analysis** - Readability scoring and content metrics
3. **Competitor Analysis** - Compare strategies and identify gaps
4. **Rank Tracking** - Monitor keyword positions over time

All features use **100% free APIs and libraries** - no paid integrations required.

## Keyword Research Module

### Features

- Extract keywords from Google Search Console data
- Identify "quick-win" opportunities (rank 10-30)
- Calculate keyword difficulty (0-100)
- Estimate traffic potential
- Show impression trends and CTR

### How It Works

1. **GSC Data Extraction**: Pulls keywords your site already ranks for
2. **Opportunity Scoring**: Ranks keywords by:
   - Current position (10-30 = high potential)
   - Search volume (impressions)
   - Difficulty estimate
   - Traffic potential if ranked #1

3. **Categories**:
   - **Quick Wins**: Rank 10-30, can move to top 3 easily
   - **High Volume**: High search volume keywords
   - **Long-tail**: Lower difficulty, easier to rank
   - **Medium**: General opportunities

### API

**Endpoint**: `POST /api/keywords/opportunities`

```json
Request:
{
  "auditId": "audit-123"
}

Response:
{
  "auditId": "audit-123",
  "total_keywords": 47,
  "quick_wins": 8,
  "opportunities": [
    {
      "keyword": "seo audit tool",
      "position": 15,
      "impressions": 340,
      "clicks": 12,
      "ctr": 3.5,
      "difficulty": 35,
      "potential": "quick-win",
      "traffic_potential": 250,
      "recommendation": "Optimize for this keyword..."
    }
  ],
  "summary": {
    "total_impressions": 4800,
    "total_clicks": 189,
    "avg_position": 18.5,
    "potential_traffic": 3420
  }
}
```

### Component

**Import**: `import { KeywordResearch } from '@/app/components/keyword-research'`

```tsx
<KeywordResearch
  auditId="audit-123"
  onLoad={(data) => console.log(data)}
/>
```

### Use Cases

- Identify 5-10 quick wins for immediate ranking improvements
- Find long-tail keywords with low competition
- Understand search intent from current rankings
- Prioritize content updates for high-volume keywords

---

## Content Analysis Module

### Features

- Word count analysis (aim for 1000-2500 words)
- Readability scoring (Flesch-Kincaid grade level)
- H1/H2/H3 structure analysis
- Internal link count and density
- Image count and optimization
- Overall content score (0-100)
- Automated issue detection

### How It Works

1. **Readability Score** (0-100):
   - Based on sentence length and complexity
   - Lower grade level = more readable
   - Target: 60-80 (8th-10th grade)

2. **Content Score** (0-100):
   - 30 points: Word count (1000+ = full points)
   - 15 points: H1 structure (exactly 1)
   - 15 points: H2 usage (2-5 per page)
   - 20 points: Readability score
   - 10 points: Internal links (3+ = full points)
   - 10 points: Images (3+ = full points)

3. **Issue Detection**:
   - Critical: Missing H1, very low word count
   - Warning: Poor readability, low internal links
   - Info: No images, missing H2 tags

### API

**Endpoint**: `POST /api/content/analyze`

```json
Request:
{
  "auditId": "audit-123"
}

Response:
{
  "pages": [
    {
      "url": "https://example.com/about",
      "wordCount": 1850,
      "readabilityScore": 72,
      "readabilityGrade": "7-8",
      "h1Count": 1,
      "h2Count": 4,
      "h3Count": 12,
      "internalLinks": 5,
      "externalLinks": 3,
      "images": 4,
      "contentScore": 85,
      "issues": [
        {
          "title": "Low External Links",
          "severity": "info",
          "description": "Consider adding external links for authority"
        }
      ]
    }
  ],
  "stats": {
    "avgWordCount": 1250,
    "avgReadability": 70,
    "avgContentScore": 78,
    "totalPages": 45,
    "pagesWithIssues": 12
  }
}
```

### Component

**Import**: `import { ContentAnalyzer } from '@/app/components/content-analyzer'`

```tsx
<ContentAnalyzer auditId="audit-123" />
```

### Benchmarks

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Word Count | 1000+ | 1200+ | 1500+ |
| Readability | 60+ | 70+ | 80+ |
| H1 Count | 1 | 1 | 1 |
| H2 Count | 2-5 | 3-4 | 4 |
| Internal Links | 3+ | 5+ | 8+ |
| Images | 1+ | 3+ | 5+ |
| Content Score | 60+ | 75+ | 85+ |

---

## Competitor Analysis Module

### Features

- Compare metrics vs competitor domains
- Identify content topics competitors cover
- Show competitor strengths and strategies
- Find content gaps (topics you should create)
- Analyze word count, readability, linking patterns
- Side-by-side metric comparison

### How It Works

1. **Data Collection**:
   - Crawl competitor domains (async)
   - Extract content metrics
   - Analyze linking structure
   - Identify top-performing content

2. **Comparison**:
   - Your domain vs each competitor
   - Highlight strengths and weaknesses
   - Show specific metric differences
   - Suggest content to create

3. **Content Gaps**:
   - Topics competitors rank for that you don't
   - Topics with high search volume
   - Topics related to your keywords

### API

**Endpoint**: `POST /api/competitors/analyze`

```json
Request:
{
  "auditId": "audit-123",
  "competitors": ["competitor1.com", "competitor2.com"]
}

Response:
{
  "yourMetrics": {
    "totalPages": 45,
    "avgWordCount": 1250,
    "avgReadability": 70,
    "avgH2Count": 3,
    "avgInternalLinks": 4
  },
  "competitors": [
    {
      "domain": "competitor1.com",
      "totalPages": 120,
      "avgWordCount": 1450,
      "avgReadability": 68,
      "avgH2Count": 3.5,
      "avgInternalLinks": 5.2,
      "topKeywords": ["keyword1", "keyword2"],
      "contentGaps": ["topic1", "topic2"],
      "strengths": ["Comprehensive content", "Strong internal linking"]
    }
  ]
}
```

### Component

**Import**: `import { CompetitorAnalysis } from '@/app/components/competitor-analysis'`

```tsx
<CompetitorAnalysis
  auditId="audit-123"
  yourDomain="yoursite.com"
  competitors={["competitor1.com", "competitor2.com"]}
/>
```

### Use Cases

- Identify content to create (content gaps)
- Benchmark your metrics vs competitors
- Understand competitor strategy
- Find content topics with high demand
- Prioritize your content roadmap

---

## Rank Tracking Module

### Features

- Track keyword positions over time
- Google Search Console integration (auto-sync)
- Manual keyword tracking
- Trend detection (up/down/stable)
- Position change tracking
- Top 3 position monitoring
- Keyword category filtering

### How It Works

1. **GSC Integration** (Automatic):
   - Pulls top keywords from Google Search Console
   - Shows position, impressions, clicks, CTR
   - Updates weekly

2. **Manual Tracking**:
   - Add keywords to track manually
   - Record current position
   - System tracks changes over time
   - Trend detection after 2+ data points

3. **Trend Analysis**:
   - Up: Position improved
   - Down: Position declined
   - Stable: No significant change

### API

**Get Rankings**: `POST /api/rank-tracking/get`

```json
Request:
{
  "auditId": "audit-123"
}

Response:
{
  "keywords": [
    {
      "keyword": "seo audit tool",
      "position": 8,
      "impressions": 1240,
      "clicks": 89,
      "ctr": 7.2,
      "trend": "up",
      "change": 2,
      "source": "gsc",
      "lastUpdated": "2026-04-28T10:30:00Z"
    }
  ],
  "total": 47,
  "topThree": 12
}
```

**Add Manual Tracking**: `POST /api/rank-tracking/add`

```json
Request:
{
  "auditId": "audit-123",
  "keyword": "new keyword",
  "position": 25
}

Response:
{
  "rankData": {
    "keyword": "new keyword",
    "position": 25,
    "trend": "stable",
    "source": "manual"
  }
}
```

### Component

**Import**: `import { RankTracker } from '@/app/components/rank-tracker'`

```tsx
<RankTracker auditId="audit-123" />
```

### Best Practices

1. **Quick Wins First**
   - Focus on keywords ranking 11-30
   - These are easiest to move to top 3
   - Each position gain = CTR increase

2. **Monitor Top Keywords**
   - Protect positions 1-3
   - These drive most traffic
   - Watch for competitor movements

3. **Seasonal Keywords**
   - Track keywords with seasonal demand
   - Plan content around peaks
   - Update timely content

4. **Content-Keyword Alignment**
   - Track keywords you optimize for
   - Verify content improvements work
   - Identify under-performing content

---

## SEO Intelligence Dashboard

The unified dashboard combines all 4 modules.

**URL**: `/seo-intelligence?auditId={id}&domain={domain}&competitors=[{list}]`

### Tabs

- **Keyword Research**: Find opportunities
- **Content Analysis**: Optimize pages
- **Competitors**: Benchmark and learn
- **Rank Tracking**: Monitor positions

### Workflow

1. Start audit from home page
2. Enter domain and (optional) competitors
3. Crawl completes
4. Automatically redirected to SEO Intelligence
5. Review all 4 modules
6. Identify top priorities
7. Execute content strategy

---

## Integration with Google Search Console

To connect real GSC data:

1. Set up OAuth integration with Google Search Console API
2. Store access tokens in user settings
3. Fetch real keyword data in `/api/keywords/opportunities`
4. Replace mock data with live GSC metrics

See `docs/GSC_INTEGRATION.md` for implementation details.

---

## Pricing vs Competitors

| Feature | Ahrefs | SEMrush | Our Platform |
|---------|--------|---------|--------------|
| Keyword Research | $99+/mo | $119+/mo | FREE |
| Content Analysis | $99+/mo | $119+/mo | FREE |
| Competitor Analysis | $99+/mo | $119+/mo | FREE |
| Rank Tracking | $99+/mo | $119+/mo | FREE |
| Backlinks | $99+/mo | $119+/mo | Coming |
| API Access | Limited | Limited | Full |

**Total savings**: $400-500/month

---

## Free APIs Used

- Google Search Console (OAuth)
- Google Trends API
- Readability scoring (local libraries)
- Website crawling (puppeteer/cheerio)

---

## Limitations & Future

### Current Limitations

- Competitor crawl data is simulated (mock)
- Backlink data not included (requires paid API)
- Rank tracking limited to GSC keywords initially
- No historical rank data tracking yet

### Future Enhancements

- Real competitor domain crawling
- Historical rank tracking over 6+ months
- Backlink analysis (via free Bing Webmaster API)
- Content recommendations (AI-powered)
- Rank prediction models
- Opportunity scoring refinement

---

## File Structure

```
SEO Intelligence Files:
├── src/app/components/
│   ├── keyword-research.tsx
│   ├── content-analyzer.tsx
│   ├── competitor-analysis.tsx
│   └── rank-tracker.tsx
├── src/app/api/
│   ├── keywords/opportunities/route.ts
│   ├── content/analyze/route.ts
│   ├── competitors/analyze/route.ts
│   └── rank-tracking/
│       ├── get/route.ts
│       └── add/route.ts
└── src/app/
    └── seo-intelligence/page.tsx
```

---

## Support & Feedback

This is a free, open-source SEO platform. For issues or feature requests, see the GitHub repo.

Version: 1.0
Last Updated: April 28, 2026
