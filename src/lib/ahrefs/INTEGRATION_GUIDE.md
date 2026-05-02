# Ahrefs Integration Guide for Intelligence Features

This guide shows how to integrate Ahrefs data into intelligence features like SEO Intelligence, Competitor Gaps, Keyword Intelligence, etc.

## Available Resources

### 1. Ahrefs API Endpoints

#### Get Domain Metrics
```bash
POST /api/ahrefs/domain-data
Body: { "domain": "example.com" }

Returns: {
  "domain_rating": 45,
  "referring_domains": 250,
  "organic_traffic": 5000,
  "organic_keywords": 1200,
  "backlinks": 3500,
  "traffic_cost": 15000,
  "ahrefs_rank": 50000
}
```

#### Get Competitor Data
```bash
POST /api/ahrefs/competitors
Body: { "competitors": ["competitor1.com", "competitor2.com"] }

Returns: {
  "competitors": [
    {
      "domain": "competitor1.com",
      "domain_rating": 52,
      "referring_domains": 300,
      "organic_traffic": 8000,
      "organic_keywords": 1500
    },
    ...
  ]
}
```

#### Competitor Gaps with Ahrefs
```bash
POST /api/intelligence/competitor-gaps-ahrefs
Body: { "auditId": "audit-123", "competitors": ["comp1.com", "comp2.com"] }

Returns analysis of your metrics vs competitors, gaps, and insights
```

### 2. React Hook for Components

Use `useAhrefsData` hook in client components:

```typescript
import { useAhrefsData, AhrefsMetricsCard } from '@/app/components/use-ahrefs-data';

export function MyComponent() {
  const { data, loading, error } = useAhrefsData('example.com');

  return (
    <div>
      <AhrefsMetricsCard data={data} />
    </div>
  );
}
```

### 3. Utility Functions

Use enrichment utilities:

```typescript
import { 
  generateAhrefsInsights, 
  compareWithCompetitors 
} from '@/lib/ahrefs/enrichment';

// Generate insights from metrics
const insights = generateAhrefsInsights(metrics);

// Compare with competitors
const gaps = compareWithCompetitors(yourMetrics, competitorMetrics);
```

## Integration Examples

### Enhance SEO Intelligence Report

```typescript
// In your seo-intelligence endpoint
const ahrefsData = await fetch('/api/ahrefs/domain-data', {
  method: 'POST',
  body: JSON.stringify({ domain: audit.domain })
});

const report = {
  ...existingReport,
  ahrefs: {
    domainRating: ahrefsData.domain_rating,
    insights: generateAhrefsInsights(ahrefsData)
  }
};
```

### Enhance Competitor Gaps

```typescript
// Use the ahrefs-enhanced endpoint
const gapAnalysis = await fetch('/api/intelligence/competitor-gaps-ahrefs', {
  method: 'POST',
  body: JSON.stringify({ auditId, competitors })
});

const { gaps, insights, yourMetrics } = await gapAnalysis.json();
```

### Add Ahrefs Data to Keyword Intelligence

```typescript
// Fetch keyword difficulty from Ahrefs
const domainMetrics = await getAhrefsDomainMetrics(domain);

// Show competitor authority when analyzing keywords
const competitorAuthority = await getCompetitorMetrics(competitors);

// Display in report:
// "Your domain (DR 45) vs competitors (avg DR 52)"
```

### Enhance Quick Wins with Backlink Opportunities

```typescript
// Show backlink gaps
const yourRD = ahrefsMetrics.referring_domains;
const competitorRD = competitorMetrics.map(c => c.referring_domains);

// Suggest: "Competitors have X more referring domains. 
// Build Y backlinks to reach parity."
```

## Features That Benefit

✅ **SEO Intelligence** - Show domain authority trends
✅ **Competitor Gaps** - Compare authority and traffic metrics
✅ **Keyword Intelligence** - Show competitor authority for keywords
✅ **Content Performance** - Link content to traffic estimates
✅ **Quick Wins** - Suggest backlink-building opportunities
✅ **Health Score** - Include authority metrics
✅ **Reports** - Add competitor benchmarking

## Availability

Ahrefs data is only available when:
1. User has configured AHREFS_API_KEY in settings
2. Their Ahrefs subscription includes API access
3. The Ahrefs API responds successfully (gracefully fails if not)

## Error Handling

```typescript
try {
  const data = await useAhrefsData(domain);
  if (!data) {
    // Ahrefs not configured or API error
    // Fall back to existing data sources
  }
} catch (error) {
  // Network error or API issue
  // Continue with existing logic
}
```

## Performance Considerations

- Ahrefs requests are asynchronous and cached by the browser
- Load Ahrefs data in parallel with other requests
- Show loading states while fetching
- Cache results for 5-10 minutes to reduce API calls
