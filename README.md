# SEO Audit Pro

SEO Audit Pro is a full-stack SEO platform for running technical audits, analyzing Google Search Console performance, and generating AI-assisted recommendations in one workflow.

## Core capabilities

### Technical SEO auditing
- Rate-limited crawler with `robots.txt` support
- Nine analyzers: meta tags, headings, internal/external links, images, structured data, security, robots, sitemap, and performance
- Rule-based scoring across Technical, On-Page, Content, and UX/Performance categories
- AI-generated summary, 30/60/90-day roadmap, KPI plan, prioritized actions, and implementation tasks
- PDF report export with `@react-pdf/renderer`

### Google Search Console workflows
- OAuth 2.0 connection from the in-app integrations page
- Property-level dashboard for impressions, clicks, CTR, and average position
- Trend chart and sortable query/page tables
- On-demand data refresh and snapshot history
- AI suggestions for striking-distance queries, low-CTR pages, title rewrites, content angles, and internal-link opportunities

### AI provider abstraction
- Supports Anthropic, OpenAI, Google Gemini, and OpenRouter
- Provider keys are stored per provider in the local database
- Optional model override by provider
- OpenRouter PKCE sign-in flow available in-app

### Authentication and tenancy
- Email/password authentication using `bcryptjs` and JWT cookies (`jose`)
- Per-user data isolation for audits, accounts, and properties

## Technology stack

| Area | Implementation |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS v4, shadcn/ui |
| Database | SQLite + Prisma 7 (`@prisma/adapter-better-sqlite3`) |
| SEO crawler | `cheerio` + native `fetch` |
| AI | Direct REST integrations (Anthropic, OpenAI, Gemini, OpenRouter) |
| Search Console | Direct Google Search Console API (v3) |
| Visualization | `recharts` |
| Reporting | `@react-pdf/renderer` |

## Getting started

### Prerequisites
- Node.js 20+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env`:

```env
DATABASE_URL=file:./dev.db
```

Create `.env.local`:

```env
JWT_SECRET=replace-with-a-strong-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional provider fallback keys:

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Most integration settings can also be configured from **Settings > Integrations** in the app.

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Start the app

```bash
npm run dev
```

Application URL: <http://localhost:3000>

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Integration setup

### Google Search Console
1. Open **Settings > Integrations > Google Search Console**.
2. Create an OAuth client in Google Cloud using the redirect URI shown in the app.
3. Save your Google Client ID and Client Secret.
4. Open **Properties**, connect your Google account, and select a verified property.

### AI provider
1. Open **Settings > Integrations > AI Provider**.
2. Select Anthropic, OpenAI, Gemini, or OpenRouter.
3. Authenticate with OpenRouter (PKCE) or provide an API key.
4. Optionally set a model override.

## Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── crawl/
│   │   ├── google/
│   │   ├── gsc/
│   │   ├── openrouter/
│   │   └── settings/
│   ├── audit/
│   ├── history/
│   ├── properties/
│   └── settings/integrations/
├── components/
│   ├── audit/
│   ├── properties/
│   ├── layout/
│   └── ui/
└── lib/
    ├── ai/
    ├── crawler/
    ├── gsc/
    ├── pdf/
    ├── auth.ts
    ├── db.ts
    └── scoring.ts
```

## Notes

- This repository uses SQLite by default for local development.
- Generated Prisma client artifacts are not committed.
- API keys and secrets should never be committed to version control.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
