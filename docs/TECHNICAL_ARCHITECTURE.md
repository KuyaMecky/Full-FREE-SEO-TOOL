# Technical Architecture

Complete technical documentation of SEO Audit Pro architecture.

## System Overview

SEO Audit Pro is built on modern web technologies:

Frontend: Next.js 16 with React
Backend: Next.js API Routes (serverless)
Database: PostgreSQL with Prisma ORM
Styling: Tailwind CSS
Language: TypeScript
Deployment: Vercel

## Architecture Diagram

```
Client (Browser)
    |
    v
Next.js App (SSR/SSG)
    |
    +---> API Routes (Serverless Functions)
    |           |
    |           +---> Database (PostgreSQL)
    |           |
    |           +---> External APIs
    |                   - Google APIs
    |                   - Third-party integrations
    |
    +---> Real-time Updates (SSE)
              |
              v
        Server-Sent Events Stream
```

## Technology Stack

### Frontend

Next.js 16
- App Router (latest routing)
- Server and Client components
- Image optimization
- Performance optimizations

React 19
- Hooks for state management
- Functional components
- Context for global state

TypeScript
- Full type safety
- Better IDE support
- Catch errors at compile time

Tailwind CSS
- Utility-first styling
- Dark mode support
- Responsive design

Lucide React
- Icon library
- 400+ icons
- Consistent design

### Backend

Next.js API Routes
- Serverless function per endpoint
- Automatic request/response handling
- Built-in middleware support

Prisma ORM
- Type-safe database queries
- Auto-migration support
- Excellent TypeScript support

PostgreSQL
- Relational database
- ACID compliance
- JSON support for flexible data

### Real-time Features

Server-Sent Events (SSE)
- Real-time progress streaming
- Automatic reconnection
- Lightweight vs WebSockets

### DevOps

Vercel
- Automatic deployment on git push
- Serverless function scaling
- Global CDN
- Built-in analytics

Git
- Version control
- Feature branches
- Commit history

## Core Features Architecture

### 1. Real-time Crawl Progress

Components:
- `CrawlProgressLive.tsx` - UI component
- `/api/crawl/progress/route.ts` - SSE endpoint
- `/api/crawl/route.ts` - Crawl initiator
- `crawl-store.ts` - In-memory state management

Flow:
1. User submits audit form
2. POST /api/audit creates audit record
3. POST /api/crawl starts background crawl
4. Crawl updates activeCrawls map every 1000ms
5. Client connects to GET /api/crawl/progress via SSE
6. Progress updates stream to client every 500ms
7. On completion, redirects to dashboard

Technologies:
- ReadableStream for SSE
- EventSource on client
- In-memory Map for state (scales to single server)

### 2. Keyword Research Module

Components:
- `KeywordResearch.tsx` - UI component
- `/api/keywords/opportunities/route.ts` - Analysis endpoint

Data Flow:
1. POST /api/keywords/opportunities with auditId
2. Fetch GSC data (mock or real)
3. Calculate opportunity score for each keyword
4. Categorize (quick-win, high-volume, long-tail)
5. Return sorted by opportunity

Scoring Algorithm:
- Position score: Keywords at 10-30 = highest score
- Impression score: Higher impressions = higher score
- Difficulty score: Lower difficulty = higher score
- Potential score: Traffic potential if ranked #1

### 3. Content Analysis Module

Components:
- `ContentAnalyzer.tsx` - UI component
- `/api/content/analyze/route.ts` - Analysis endpoint

Process:
1. Get all crawl results for audit
2. Calculate per-page metrics:
   - Word count (estimated)
   - Readability score (Flesch-Kincaid)
   - H1/H2/H3 structure
   - Internal links
   - Images
3. Generate content score (0-100):
   - 30 points: Word count
   - 15 points: H1 structure
   - 15 points: H2 usage
   - 20 points: Readability
   - 10 points: Internal links
   - 10 points: Images
4. Identify issues (critical, warning, info)
5. Return all metrics and aggregate stats

### 4. Competitor Analysis Module

Components:
- `CompetitorAnalysis.tsx` - UI component
- `/api/competitors/analyze/route.ts` - Analysis endpoint

Process:
1. Get your domain metrics from crawl results
2. For each competitor:
   - Simulate crawl data (production: real crawl)
   - Calculate same metrics as your site
   - Compare side-by-side
   - Identify content gaps
   - Extract competitor strengths
3. Return comparison data

Future Enhancement:
- Real competitor domain crawling
- Actual content extraction
- Topic/keyword extraction from competitor content

### 5. Rank Tracking Module

Components:
- `RankTracker.tsx` - UI component
- `/api/rank-tracking/get/route.ts` - Fetch data
- `/api/rank-tracking/add/route.ts` - Add keyword

Data Storage:
- GSC data: From Google Search Console (automatic)
- Manual data: Stored in audit.rankTrackingData (JSON)

Features:
- Automatic GSC sync
- Manual keyword addition
- Trend detection (up/down/stable)
- Position change tracking

## Database Schema (Prisma)

Key Models:

```prisma
model Audit {
  id                    String
  userId                String
  domain                String
  status                String  // pending, crawling, analyzing, complete
  maxPages              Int
  crawlResults          CrawlResult[]
  keywordOpportunities  String?  // JSON
  contentMetrics        String?  // JSON
  competitorAnalysis    String?  // JSON
  rankTrackingData      String?  // JSON
}

model CrawlResult {
  id                String
  auditId           String
  url               String
  statusCode        Int
  title             String?
  metaDescription   String?
  canonical         String?
  h1                String?
  headings          String  // JSON
  links             String  // JSON
  images            String  // JSON
  structuredData    String  // JSON
  issues            String  // JSON
  responseTime      Int
  contentLength     Int
}

model User {
  id                String
  email             String
  password          String
  name              String
  audits            Audit[]
  settings          Settings?
}
```

## API Endpoints

### Audit Management
- POST /api/audit - Create audit
- GET /api/audit - List audits
- GET /api/audit/[id] - Get specific audit

### Crawling
- POST /api/crawl - Start crawl
- GET /api/crawl/progress - Stream progress (SSE)

### Analysis
- POST /api/keywords/opportunities - Keyword analysis
- POST /api/content/analyze - Content metrics
- POST /api/competitors/analyze - Competitor comparison
- POST /api/rank-tracking/get - Get tracked keywords
- POST /api/rank-tracking/add - Add manual keyword

### Utilities
- GET /api/n8n/init - Automation status
- POST /api/analyze - Trigger analysis pipeline

## Real-time Communication

Server-Sent Events (SSE):

Endpoint: GET /api/crawl/progress?auditId={id}

Protocol:
```
data: {"totalPages":250,"crawledPages":45,...}

data: {"totalPages":250,"crawledPages":46,...}

data: {"totalPages":250,"crawledPages":250,"status":"complete",...}
```

Client (JavaScript EventSource):
```javascript
const source = new EventSource(`/api/crawl/progress?auditId=${id}`);

source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateProgress(data);
};

source.onerror = () => source.close();
```

## State Management

Frontend:
- React hooks (useState, useEffect)
- Optional: Context API for global state
- Not using Redux (simple app)

Backend:
- In-memory Map for active crawls
- Database (PostgreSQL) for persistent state
- JSON fields for flexible data

## Performance Considerations

Crawling:
- Max 200 pages per audit (performance)
- 2 concurrent requests (respect server load)
- 500ms delay between requests
- 30-second timeout per crawl

API:
- Serverless functions auto-scale
- Database connection pooling
- Result caching not implemented (fresh data each time)

Frontend:
- Next.js image optimization
- Code splitting
- Lazy loading of components
- Tailwind CSS purging

## Security

Authentication:
- JWT tokens (if implemented)
- Session-based auth
- Password hashing (bcrypt)

Data Protection:
- User can only see their audits
- Database access control via Prisma
- No sensitive data in URLs
- HTTPS only (Vercel enforces)

API Security:
- Input validation
- Rate limiting (Vercel)
- CORS configured
- No secrets in code (environment variables)

## Scalability

Current Architecture:
- Single Vercel deployment
- One database instance
- In-memory crawl state (works for single server)

Future Scaling:
- Replace in-memory Map with Redis
- Database read replicas
- Multiple Vercel regions
- CDN for static assets (already via Vercel)
- Background job queue for long-running tasks

## Development Workflow

Local Development:
```bash
npm install
npm run dev
```

Database:
```bash
npx prisma migrate dev
```

Build & Deploy:
```bash
git push origin main  # Auto-deploys to Vercel
```

## Monitoring & Logging

Logging:
- console.log for debugging
- Error tracking (Vercel automatically logs)
- Structured logging not implemented yet

Monitoring:
- Vercel dashboard shows:
  - Response times
  - Error rates
  - Cold start times
  - Execution time

Future:
- Sentry for error tracking
- DataDog for metrics
- Custom analytics

## Environment Variables

Required:
```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

Optional:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENROUTER_API_KEY=...
```

## Testing

Current:
- Manual testing via UI
- No automated tests implemented

Future:
- Jest for unit tests
- Playwright for E2E tests
- API integration tests

## Deployment

Platform: Vercel

Process:
1. Push to main branch
2. Vercel auto-detects Next.js
3. Builds and deploys
4. Automatic SSL
5. Global CDN distribution

Environments:
- Production: main branch
- Preview: Pull requests

## File Structure

```
src/
  app/
    components/          # UI components
      keyword-research.tsx
      content-analyzer.tsx
      competitor-analysis.tsx
      rank-tracker.tsx
      crawl-progress-live.tsx
      terminal-*.tsx
    api/                 # API routes
      crawl/
      keywords/
      content/
      competitors/
      rank-tracking/
    seo-intelligence/    # Main dashboard page
  components/            # Shared UI components
  lib/                   # Utilities
    crawler/             # Crawling logic
    db.ts                # Database client
    auth.ts              # Authentication
  styles/                # Global styles
  
docs/                    # Documentation
  COMPLETE_USER_GUIDE.md
  QUICK_START.md
  TECHNICAL_ARCHITECTURE.md
  SEO_INTELLIGENCE.md
  
prisma/
  schema.prisma          # Database schema
```

## Future Improvements

Backend:
- Real competitor crawling
- Historical rank data storage
- Backlink analysis (free API)
- Content recommendations (AI)
- Custom webhooks

Frontend:
- Dark/light mode toggle
- Custom dashboards
- Report generation (PDF)
- Bulk actions
- Advanced filtering

Features:
- User team collaboration
- White-label reports
- Custom branding
- API key system
- Webhook triggers

## Conclusion

SEO Audit Pro uses a modern, scalable architecture with serverless functions and a managed database. The real-time progress streaming via SSE provides a responsive user experience. Future improvements can scale to thousands of concurrent audits without major architectural changes.

Version: 1.0
Last Updated: April 28, 2026
