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

## Deploy to Vercel (with Turso)

Vercel's filesystem is read-only — local SQLite won't persist there. Use [Turso](https://turso.tech) (SQLite-as-a-service, generous free tier) to keep the existing schema.

### 1. Create a Turso database

```bash
# Install the Turso CLI (macOS/Linux)
curl -sSfL https://get.tur.so/install.sh | bash

# Or see https://docs.turso.tech/cli/installation for Windows/winget

turso auth signup      # or: turso auth login
turso db create seo-audit
turso db show seo-audit --url
turso db tokens create seo-audit
```

Save the **database URL** (starts with `libsql://…`) and the **auth token**.

### 2. Apply the schema

```bash
# Bundles all Prisma migrations into prisma/turso-schema.sql
npm run turso:schema

# Pipe it into your Turso DB
turso db shell seo-audit < prisma/turso-schema.sql
```

### 3. Deploy on Vercel

1. Push the repo to GitHub (already done if you're here).
2. On Vercel, **Add New → Project**, import the repo.
3. In **Environment Variables**, add:
   - `TURSO_DATABASE_URL` — the `libsql://…` URL from step 1
   - `TURSO_AUTH_TOKEN` — the token from step 1
   - `JWT_SECRET` — any long random string
   - `NEXT_PUBLIC_APP_URL` — your deployment URL, e.g. `https://seo-audit-pro.vercel.app`
4. Click **Deploy**. Vercel runs `prisma generate && next build`.

### 4. After first deploy

- Visit your deploy URL, register an account.
- All integrations (Google OAuth, AI provider, PageSpeed API key) are saved to Turso via the in-app Settings screens — no redeploy needed.
- If you use Google OAuth, add your Vercel URL's callback (`https://your-app.vercel.app/api/google/callback`) to the authorized redirect URIs in Google Cloud Console.

### Schema updates

When you add a new Prisma migration:

```bash
npx prisma migrate dev --name your_change   # local
npm run turso:schema                        # rebuild bundled sql
# Apply only the new migration to Turso:
turso db shell seo-audit < prisma/migrations/<new_migration>/migration.sql
git push                                    # Vercel redeploys automatically
```

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
