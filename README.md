# SEO Audit Pro

A full-stack SEO platform that combines a technical-SEO crawler, Google Search Console performance data, and AI-generated recommendations — all in one app. Built with Next.js 16, Prisma 7, and a pluggable multi-provider AI layer (Anthropic Claude, OpenAI, Google Gemini, or OpenRouter).

## Features

### Technical SEO audits
- Rate-limited crawler that respects `robots.txt`
- 9 specialized analyzers: meta tags, headings, internal/external links, images, structured data, security, robots, sitemaps, performance
- Rule-based scoring across Technical / On-Page / Content / UX-Performance categories
- AI-generated executive summary, 30-60-90 day roadmap, KPI plan, prioritized action items, and dev task list
- Full report export via `@react-pdf/renderer`

### Google Search Console integration
- OAuth 2.0 sign-in (in-app setup wizard — no manual `.env` editing required)
- Per-property dashboard with:
  - KPI cards (impressions, clicks, CTR, average position)
  - 28-day trend chart (recharts)
  - Sortable/filterable queries table with position data
  - Sortable/filterable pages table
- On-demand snapshot refresh
- AI suggestions that combine rule-based opportunity detection (striking-distance queries, low-CTR pages) with LLM-written title rewrites, content angles, and internal-link ideas

### Multi-provider AI
- Pick between **Anthropic Claude**, **OpenAI**, **Google Gemini**, or **OpenRouter** from a settings UI
- API keys stored per-provider in the local DB — switch providers without losing keys
- OpenRouter PKCE sign-in (one-click, no manual key copy-paste)
- Model override per provider
- One abstraction powers both audit reports and GSC suggestions

### Authentication
- Email/password auth with `bcryptjs` + `jose` JWT sessions (HTTP-only cookies)
- Per-user data isolation across audits, Google accounts, and properties

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Radix-based shadcn/ui components |
| DB | SQLite via Prisma 7 (`@prisma/adapter-better-sqlite3`) |
| Auth | `jose` JWT + `bcryptjs` |
| Crawler | `cheerio` + native `fetch` |
| AI | Raw `fetch` against Anthropic / OpenAI / Gemini / OpenRouter REST APIs |
| GSC | Direct Search Console v3 API calls (no `googleapis` SDK — keeps bundle lean) |
| Charts | recharts |
| PDF | `@react-pdf/renderer` |

## Quick start

### 1. Install

```bash
npm install
```

### 2. Environment

Create `.env` with:

```
DATABASE_URL=file:./dev.db
```

Create `.env.local` with:

```
JWT_SECRET=your-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

All other keys (Google OAuth, AI provider keys) can be configured **in the app UI** under Settings → Integrations. No manual env editing required.

Optionally pre-populate env-level fallbacks:

```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. Database

```bash
npx prisma migrate dev
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>, register an account, and you're in.

## Configuring integrations

### Google Search Console

1. Go to **Settings → Integrations → Google Search Console**.
2. The page shows the exact redirect URI to paste into Google Cloud Console, plus a step-by-step guide for creating an OAuth client.
3. Paste your Client ID and Client Secret into the form and save.
4. Back on **Properties**, click **Connect Google Search Console** to authorize your Google account.
5. Pick a verified property, and the app auto-fetches the first 28-day snapshot.

### AI provider

1. Go to **Settings → Integrations → AI Provider**.
2. Pick one of four providers.
3. Either:
   - **Sign in with OpenRouter** (PKCE — one click, no copy-paste), or
   - Paste an API key from the provider's console.
4. Optionally override the default model.

Provider defaults: `claude-sonnet-4-6`, `gpt-5`, `gemini-2.5-pro`, `anthropic/claude-sonnet-4.5` (for OpenRouter).

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/           # AI audit report generation
│   │   ├── audit/             # Audit CRUD
│   │   ├── auth/              # login/register/logout/me
│   │   ├── crawl/             # Crawler trigger + progress stream
│   │   ├── google/            # Google Search Console OAuth
│   │   ├── gsc/               # GSC properties, snapshots, suggestions
│   │   ├── openrouter/        # OpenRouter PKCE flow
│   │   └── settings/          # DB-backed integration config
│   ├── audit/                 # Audit create + detail pages
│   ├── history/               # Past audits
│   ├── properties/            # GSC dashboard
│   └── settings/
│       └── integrations/      # Google + AI setup wizards
├── components/
│   ├── audit/                 # Report views
│   ├── properties/            # GSC dashboard widgets
│   ├── layout/                # Header
│   └── ui/                    # shadcn primitives
├── lib/
│   ├── ai/
│   │   ├── analysis.ts        # Audit report prompts
│   │   ├── suggestions.ts     # GSC opportunity + LLM rewrites
│   │   ├── config.ts          # Provider selection / key storage
│   │   └── provider.ts        # Unified generateText() dispatcher
│   ├── crawler/               # Crawler + 9 analyzers
│   ├── gsc/                   # Google Search Console client
│   ├── pdf/                   # Report PDF generation
│   ├── auth.ts                # JWT session helpers
│   ├── db.ts                  # Prisma client w/ SQLite adapter
│   └── scoring.ts             # SEO scoring engine
└── generated/prisma/          # Prisma Client (gitignored)
```

## Roadmap

- Google Analytics 4 integration for session/traffic data
- PageSpeed Insights API integration for Core Web Vitals history
- URL Inspection API for index-coverage reporting
- Scheduled snapshots (daily/weekly cron)
- Per-keyword rank-tracking beyond GSC's rolling 28-day window
- Competitor comparison view
- Team/workspace support

## License

MIT — see [LICENSE](./LICENSE).
