# SEO Audit Pro

> A comprehensive, Google-free SEO platform for technical audits, search console analytics, AI-powered content generation, and WordPress publishing.

## Overview

**SEO Audit Pro** is a full-stack SEO platform designed to empower digital marketers, SEO professionals, and content creators with data-driven insights and automated workflows. The platform combines technical site auditing, Google Search Console analytics, AI-assisted content generation, and direct WordPress publishing in a unified interface — eliminating the need for multiple disconnected tools.

### Key Philosophy
- **API-First Approach**: Leverages free and open APIs (Google Search Console, WordPress REST) without proprietary backlinks or ranking data APIs
- **Privacy-Focused**: All data is stored locally or in your own database — no third-party data warehousing
- **Extensible Architecture**: Modular design supports custom analyzers, AI providers, and integration workflows

---

## Core Features

### 🔍 Technical SEO Auditing
Comprehensive site analysis with rule-based scoring and AI-generated actionable insights.

**Capabilities:**
- **Rate-limited web crawler** with `robots.txt` and `meta[robots]` support for responsible crawling
- **Nine specialized analyzers**: meta tags, heading structure, internal/external links, images, structured data, security headers, robots directives, sitemap validation, and Core Web Vitals
- **Multi-category scoring** across Technical SEO, On-Page SEO, Content Quality, and UX/Performance metrics
- **AI-generated insights** including executive summary, 30/60/90-day roadmap, KPI tracking plan, prioritized issue list, and implementation task breakdown
- **PDF report export** with customizable branding and metrics visualization

**How to Use:**
1. Navigate to **Audits** → **New Audit**
2. Enter target URL and select crawl parameters (depth, concurrency, include subdomains)
3. Review findings across analyzer categories; click each issue for detailed remediation guidance
4. Generate AI summary and export as PDF for stakeholder review

**Open for Enhancement:**
- [ ] Custom analyzer plugins for industry-specific SEO checks (e-commerce, news, SaaS)
- [ ] Comparative audits (before/after tracking across date ranges)
- [ ] Automated scheduling for periodic audits with email notifications
- [ ] Integration with lighthouse API for more granular performance metrics

---

### 📊 Google Search Console Analytics
Real-time GSC data integration with trend analysis and AI-powered optimization suggestions.

**Capabilities:**
- **OAuth 2.0 authentication** with Google Cloud (configured directly in the app)
- **Property-level dashboard** displaying impressions, clicks, click-through rate (CTR), and average position by query and page
- **Interactive trend charts** with date range selection and metric comparison
- **Sortable data tables** for queries (with position filters) and landing pages (with performance tiers)
- **On-demand data refresh** with snapshot history for change tracking
- **AI suggestions** for:
  - "Striking distance" queries (positions 4–10) ready for rank push
  - Low-CTR pages with title and meta description optimization recommendations
  - Internal linking opportunities based on query intent
  - Content gap analysis from top-performing queries

**How to Use:**
1. Go to **Settings** → **Integrations** → **Google Search Console**
2. Authorize your Google account and select a verified Search Console property
3. View real-time data in **Properties** dashboard
4. Use filters (date range, position range, impression/click thresholds) to identify opportunities
5. Click "Get AI Suggestions" for actionable next steps

**Open for Enhancement:**
- [ ] Multi-property view with aggregated KPI dashboard
- [ ] GSC data export to CSV/Sheets for collaborative analysis
- [ ] Automated alert thresholds (e.g., notify when CTR drops 10%)
- [ ] A/B testing framework for monitoring title/meta changes

---

### 🤖 AI-Powered Content Generation & WordPress Publishing
Generate SEO-optimized articles directly from GSC insights and publish them to WordPress with one click.

**Capabilities:**
- **Content idea generation** from GSC ranking data, site structure, and keyword gaps
- **Full-length article writing** with SEO optimization, heading hierarchy, internal linking, and schema markup
- **Structured metadata generation** including SEO title, meta description, slug, focus keyword, and JSON-LD schema
- **Image suggestions** with recommended alt text and sizing for featured images
- **WordPress REST API integration** with Yoast SEO and Rank Math plugin compatibility
- **Draft management** with preview, editing, and revision history
- **Dual-plugin support** automatically populates both Yoast and Rank Math meta fields for maximum compatibility

**How to Use:**
1. Navigate to **Content** → **Generate New Article**
2. Select GSC property, target query, and optional content cluster
3. Configure AI provider settings (model, tone, target word count)
4. Review generated draft in **Content** → **Drafts**
5. Click the draft to open the editor and customize content, SEO fields, or heading structure
6. Select target WordPress site and publication mode (Draft or Live)
7. Click **Publish** to send to WordPress; verify on your WordPress admin panel

**Open for Enhancement:**
- [ ] Multi-language content generation (with language-specific SEO rules)
- [ ] Content clustering and pillar/supporting article workflows
- [ ] Built-in plagiarism detection before publishing
- [ ] Scheduled publishing with automated social media posting
- [ ] Content audit workflows (review, approve, reject) for teams
- [ ] Integration with other CMSs (HubSpot, Webflow, Contentful)

---

### 🔌 AI Provider Abstraction Layer
Flexible multi-provider support for AI generation with in-app provider management.

**Supported Providers:**
- **Anthropic Claude** (Opus, Sonnet, Haiku)
- **OpenAI** (GPT-4, GPT-4 Turbo, GPT-3.5)
- **Google Gemini** (Pro, Ultra)
- **OpenRouter** (100+ open-source and proprietary models)

**Capabilities:**
- Store API keys per provider in the database with encryption
- Override model selection per provider for A/B testing different models
- PKCE-based OAuth sign-in flow for OpenRouter (no hardcoded keys needed)
- Token usage tracking and cost estimation per request
- Fallback provider configuration for redundancy

**How to Use:**
1. Go to **Settings** → **Integrations** → **AI Provider**
2. Choose primary provider and authenticate (API key or OAuth)
3. Optionally set a custom model override for non-default generations
4. All content generation requests use the configured provider automatically

**Open for Enhancement:**
- [ ] Provider cost analytics dashboard (cost per provider, per feature)
- [ ] A/B testing framework to compare output quality across providers
- [ ] Local LLM support (Ollama, LiteLLM proxy) for privacy-first deployments
- [ ] Rate limiting and quota management per provider
- [ ] Model performance comparison reports

---

### 🔐 Authentication & Multi-Tenancy
Enterprise-grade authentication with role-based access control.

**Capabilities:**
- **Email/password authentication** using industry-standard bcryptjs and JWT
- **Secure cookie-based sessions** via `jose` library
- **Per-user data isolation** for audits, accounts, Google Search Console connections, and AI provider keys
- **JWT token rotation** and automatic session refresh

**How to Use:**
1. Visit the login page and create an account with email and password
2. Once logged in, all data (audits, GSC properties, integrations) is scoped to your account
3. Change password or reset via email in **Settings** → **Account**

**Open for Enhancement:**
- [ ] Role-based access control (Admin, Editor, Viewer)
- [ ] Team/organization accounts with user invitations
- [ ] Single Sign-On (SSO) via SAML 2.0 or OAuth
- [ ] API keys for programmatic access
- [ ] Two-factor authentication (2FA)

---

## Technology Stack

### Architecture Overview

| Category | Technology | Purpose | Version |
| --- | --- | --- | --- |
| **Framework** | Next.js 16 | Full-stack React framework with App Router, API routes, and built-in optimization | 16.x |
| **Frontend** | React 19 | UI library with hooks and concurrent rendering | 19.x |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework for rapid UI development | 4.x |
| **UI Components** | shadcn/ui | High-quality, copy-paste React component library | Latest |
| **Database** | Neon PostgreSQL | Cloud-native PostgreSQL with serverless compute (local: SQLite) | Latest |
| **ORM** | Prisma 7 | Type-safe database client with schema migrations | 7.x |
| **Web Crawler** | `cheerio` + native `fetch` | HTML parsing and HTTP client for site crawling | - |
| **AI Integration** | REST APIs | Direct HTTP integration with Anthropic, OpenAI, Google, OpenRouter | - |
| **APIs** | Google Search Console v3 | Official Google API for search performance data | v3 |
| **Charts & Viz** | `recharts` | React-based charting library for data visualization | Latest |
| **PDF Export** | `@react-pdf/renderer` | HTML-to-PDF conversion for audit reports | Latest |
| **Authentication** | bcryptjs, jose | Password hashing and JWT token management | Latest |
| **HTTP Client** | native `fetch` + `AbortSignal` | Zero-dependency HTTP requests with timeout support | - |

### Database Configuration

**Local Development:**
- SQLite via `@prisma/adapter-better-sqlite3` for zero external dependencies
- Migrations tracked in `prisma/migrations/`
- Database file: `dev.db` (git-ignored)

**Production (Vercel):**
- Neon PostgreSQL (serverless, auto-scaling, free tier available)
- Migrations applied via `turso-schema.sql` or direct SQL execution
- Full schema type-safety via Prisma client generation

### Dependency Philosophy
- **Minimal external dependencies** for core functionality (SEO crawler, API integrations)
- **Opinionated but flexible** component library (shadcn/ui) allows customization without vendor lock-in
- **No CSS-in-JS**: Tailwind for performance and static analysis
- **Direct API integrations** rather than heavy SDKs where possible

---

## Getting Started

### Prerequisites

- **Node.js 20+** — Install from [nodejs.org](https://nodejs.org)
- **npm 10+** — Comes with Node.js
- **Git** — Version control for cloning the repo

### 1. Clone the Repository

```bash
git clone https://github.com/KuyaMecky/Full-FREE-SEO-TOOL.git
cd seo-audit-app
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json` and generates the Prisma client.

### 3. Configure Environment Variables

#### Create `.env` (Database connection)

```env
# Local SQLite development
DATABASE_URL=file:./dev.db
```

**For Neon PostgreSQL (production/cloud):**
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

#### Create `.env.local` (Application secrets)

```env
# Authentication
JWT_SECRET=your-strong-random-secret-min-32-chars

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Provider fallback keys (can also be set in-app)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...

# Optional: Google OAuth for Search Console
GOOGLE_CLIENT_ID=...clients.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

**Security Note:** 
- Never commit `.env` or `.env.local` files
- Use strong, random values for `JWT_SECRET` (at least 32 characters)
- Rotate secrets regularly in production
- Most integration keys can also be configured from the **Settings > Integrations** UI without hardcoding

### 4. Initialize the Database

```bash
# Create schema and run migrations
npx prisma migrate dev

# (Optional) Seed development data
npx prisma db seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

**First Access:**
1. Create an account with email and password
2. Configure integrations (**Settings > Integrations**)
3. Run your first audit or connect Google Search Console

---

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Run linter (ESLint + Prettier)
npm run lint

# Format code with Prettier
npm run format

# Type check TypeScript
npx tsc --noEmit

# Run Prisma Studio (interactive database browser)
npx prisma studio

# Generate schema SQL for deployment
npm run turso:schema

# Create a new database migration
npx prisma migrate dev --name migration_name
```

---

## Integration Setup

### Google Search Console

Required for accessing search performance data and ranking insights.

**Steps:**

1. Navigate to **Settings** → **Integrations** → **Google Search Console**
2. Click "Connect Google Account" and authorize with your Google credentials
3. The app will display a **redirect URI** — copy this value
4. Go to [Google Cloud Console](https://console.cloud.google.com):
   - Create a new project or select an existing one
   - Enable the "Google Search Console API"
   - Create an OAuth 2.0 credential (Web application)
   - Add the redirect URI from step 3 to authorized redirect URIs
   - Copy the **Client ID** and **Client Secret**
5. Return to SEO Audit Pro and paste the Client ID and Secret
6. Click "Connect Google Account" again to authorize access to your Search Console properties
7. Select a verified Search Console property from the dropdown

**Verification:** You should see search data appear in the **Properties** dashboard within 5 minutes.

### AI Provider

Choose one or more AI providers for content generation and analysis.

**Steps:**

1. Go to **Settings** → **Integrations** → **AI Provider**
2. Select your primary provider from the dropdown (Anthropic, OpenAI, Gemini, or OpenRouter)
3. **Authentication method depends on provider:**
   - **Anthropic/OpenAI/Gemini**: Paste your API key from the provider's dashboard
   - **OpenRouter**: Click "Sign in with OpenRouter" for PKCE OAuth flow (no hardcoded key needed)
4. **(Optional)** Set a custom model override for testing different models
5. Click "Test Connection" to verify credentials

**API Key Locations:**
- [Anthropic Console](https://console.anthropic.com)
- [OpenAI Platform](https://platform.openai.com/api-keys)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [OpenRouter Dashboard](https://openrouter.ai/keys)

**Recommendation:** Start with OpenRouter for model flexibility on the free tier.

### WordPress Connection

Set up publishing to your WordPress site.

**Steps:**

1. Go to **Settings** → **Integrations** → **WordPress**
2. Enter your WordPress site URL (e.g., `https://myblog.com`)
3. Create an Application Password in WordPress:
   - Log in to WordPress admin
   - Go to **Users** → **Your Profile** → **Application Passwords**
   - Create a new password, copy it
4. Paste the application password into SEO Audit Pro
5. Click "Test Connection" to verify
6. The app now has permission to publish articles to your WordPress site

**Note:** The app will populate both **Yoast SEO** and **Rank Math** meta fields automatically for maximum compatibility.

---

## Deployment Guide

### Local Development

For local development, SQLite is used for simplicity and zero configuration.

```bash
npm run dev
```

Database file is automatically created at `./dev.db` (git-ignored).

### Production Deployment

Vercel's filesystem is ephemeral — local SQLite won't persist. Use **Neon PostgreSQL** for serverless, auto-scaling database.

#### Option 1: Deploy to Vercel + Neon (Recommended)

**Step 1: Create a Neon PostgreSQL Database**

1. Sign up at [Neon Console](https://console.neon.tech)
2. Create a new project (free tier included)
3. Copy the **Connection String** (looks like `postgresql://user:password@host.neon.tech/dbname`)

**Step 2: Push Schema to Neon**

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://user:password@host.neon.tech/dbname"

# Run migrations against Neon
npx prisma migrate deploy

# Unset temporary variable
unset DATABASE_URL
```

**Step 3: Deploy to Vercel**

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New** → **Project**
3. Import the repository
4. In **Environment Variables**, add:
   ```
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname
   JWT_SECRET=your-strong-random-secret-32-chars-minimum
   NEXT_PUBLIC_APP_URL=https://your-deployment-url.vercel.app
   ```
5. Click **Deploy**

**Step 4: Post-Deployment**

- Visit your deployment URL and create an account
- Configure integrations via **Settings** (Google OAuth, AI provider, WordPress) — these are saved to Neon and persist
- If using Google OAuth, add your Vercel callback URL to Google Cloud Console authorized redirect URIs:
  ```
  https://your-deployment-url.vercel.app/api/google/callback
  ```

#### Option 2: Self-Hosted (Docker, Railway, Heroku, etc.)

For more control, deploy the app to any Node.js-compatible platform:

1. Ensure Node.js 20+ is available
2. Set `DATABASE_URL` to your PostgreSQL/MySQL/SQLite database
3. Set all required env vars (JWT_SECRET, NEXT_PUBLIC_APP_URL, etc.)
4. Run:
   ```bash
   npm install
   npx prisma migrate deploy
   npm run build
   npm start
   ```

### Schema Migrations in Production

When you add a new Prisma migration:

```bash
# Create migration locally
npx prisma migrate dev --name your_change_name

# Deploy migration to production
npx prisma migrate deploy

# Verify schema
npx prisma studio
```

For Neon-specific commands, see the [Neon CLI documentation](https://neon.com/docs/reference/neon-cli).

---

## Project Structure

```text
seo-audit-app/
├── src/
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── analyze/          # Analysis endpoints
│   │   │   ├── audit/            # Audit orchestration
│   │   │   ├── auth/             # Authentication (login, logout, register)
│   │   │   ├── crawl/            # Web crawler endpoints
│   │   │   ├── content/          # Content generation & drafts
│   │   │   ├── google/           # Google OAuth callback
│   │   │   ├── gsc/              # Google Search Console data sync
│   │   │   ├── wordpress/        # WordPress integration
│   │   │   └── settings/         # Settings and integrations
│   │   ├── audit/                # Audit results page
│   │   ├── content/              # Content generation & drafts UI
│   │   ├── properties/           # GSC properties dashboard
│   │   ├── settings/             # Settings UI
│   │   └── auth/                 # Login/register pages
│   ├── components/               # Reusable React components
│   │   ├── audit/                # Audit-specific components
│   │   ├── content/              # Content generation components
│   │   ├── properties/           # Properties dashboard components
│   │   ├── layout/               # Layout shells and navigation
│   │   └── ui/                   # Base UI components (shadcn/ui)
│   ├── lib/                      # Shared utilities and business logic
│   │   ├── ai/                   # AI provider integrations & generation
│   │   ├── crawler/              # Web crawling logic
│   │   ├── gsc/                  # Google Search Console API client
│   │   ├── wordpress/            # WordPress REST API client
│   │   ├── pdf/                  # PDF report generation
│   │   ├── auth.ts               # JWT and session management
│   │   ├── db.ts                 # Database client initialization
│   │   └── scoring.ts            # SEO scoring algorithms
│   └── styles/                   # Global CSS (Tailwind)
├── prisma/
│   ├── schema.prisma             # Database schema definition
│   ├── migrations/               # Database migration history
│   └── seed.ts                   # Optional seed data
├── public/                       # Static assets
├── .env                          # Database connection (local)
├── .env.local                    # Secrets and API keys (not committed)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.ts                # Next.js configuration
└── README.md                     # This file
```

### Key Directories Explained

**`src/app/api/`** — Server-side API routes handling:
- User authentication and session management
- Web crawling and SEO analysis
- Google Search Console data fetching
- Content generation and AI requests
- WordPress publishing
- Integration settings and secrets

**`src/lib/ai/`** — AI abstraction layer:
- Multi-provider support (Anthropic, OpenAI, Gemini, OpenRouter)
- Content idea generation from GSC data
- Full article generation with SEO optimization
- Token usage tracking and cost estimation

**`src/lib/crawler/`** — Web crawling engine:
- HTML parsing and link extraction
- Robots.txt and meta robots compliance
- Rate limiting and concurrent request management
- Analyzer plugins (meta, heading, links, images, schema, security, etc.)

---

## Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes SEO Audit Pro better.

### Development Workflow

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Full-FREE-SEO-TOOL.git
   cd seo-audit-app
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit with clear messages:
   ```bash
   git commit -m "feat: add new feature" 
   # or
   git commit -m "fix: resolve issue with X"
   ```
5. **Push to your fork** and **open a Pull Request** against the main repository

### Code Standards

- **TypeScript**: All code must pass `npx tsc --noEmit` type checking
- **Linting**: Run `npm run lint` and fix issues before committing
- **Formatting**: Use Prettier — run `npm run format` to auto-fix
- **Testing**: Write tests for new features (`*.test.ts` or `*.spec.ts`)
- **Documentation**: Update relevant sections of README and code comments

### Submitting a Pull Request

1. Ensure all tests pass and linting is clean
2. Write a clear PR title and description explaining the changes
3. Reference any related issues (e.g., "Closes #123")
4. Wait for review and be open to feedback

---

## Extending the App

### Adding a New Analyzer

Analyzers are modular SEO checks. To add a custom analyzer:

**Location:** `src/lib/crawler/analyzers/`

**Example template:**
```typescript
export interface CustomAnalyzerResult {
  passed: number;
  failed: number;
  warnings: { url: string; message: string }[];
}

export async function analyzeCustomFeature(
  crawlData: CrawlResult[]
): Promise<CustomAnalyzerResult> {
  // Your analysis logic
  return { passed, failed, warnings };
}
```

Register the analyzer in `src/lib/crawler/index.ts` to include it in audits.

### Adding a New AI Provider

To integrate a new AI provider:

**Location:** `src/lib/ai/providers/`

**Required functions:**
- `authenticate(apiKey: string): Promise<boolean>`
- `generateContent(prompt: string, options: GenerationOptions): Promise<GenerationResult>`
- `estimateCost(tokens: number): number`

Add provider configuration to the Settings UI in `src/app/settings/integrations/`.

### Adding a New Integration

To integrate a new external service (CMS, analytics, etc.):

**Location:** `src/lib/{service-name}/` and `src/app/api/{service-name}/`

**Steps:**
1. Create API client in `src/lib/{service-name}/client.ts`
2. Add API routes in `src/app/api/{service-name}/`
3. Add database models to `prisma/schema.prisma`
4. Create integration UI in `src/app/settings/integrations/`
5. Update this README with setup instructions

---

## Dependencies for Contributing

### Required for Development

- **Node.js 20+** — For running the development server and build tools
- **npm 10+** — Package manager
- **Git** — Version control

### Optional Tools (Recommended)

For easier development, install these tools:

```bash
# Database browser
npm install -g prisma

# TypeScript type checking
npm install -g typescript

# REST client for testing APIs
# (VS Code extension: "REST Client" by Huachao Zheng)

# Database client (for Neon PostgreSQL)
# https://www.pgadmin.org/ or https://dbeaver.io/

# API testing
# Postman: https://www.postman.com/
# Insomnia: https://insomnia.rest/
```

### Adding New Dependencies

Before adding a new dependency, consider:

1. **Is it necessary?** Check if existing packages cover the need
2. **Size impact**: Check bundle size with `npm ls packagename`
3. **Maintenance**: Verify the package is actively maintained
4. **Alternatives**: Compare with similar packages on [npm](https://www.npmjs.com/)

**To add a dependency:**
```bash
npm install package-name
```

**For dev dependencies only:**
```bash
npm install --save-dev package-name
```

**Update this list in `.github/CONTRIBUTING.md` if adding major dependencies.**

### Current Dependency Constraints

- ⚠️ **AI Token Limits**: All AI calls are capped at `maxTokens: 2000` to fit OpenRouter's free tier
- ⚠️ **Database**: PostgreSQL in production, SQLite in development (must support both via Prisma adapters)
- ⚠️ **Framework**: Next.js 16+ with breaking changes — read `AGENTS.md` before adding Next.js-specific code
- ✅ **Styling**: Tailwind CSS v4 — prefer utility classes over new CSS libraries

---

## Future Roadmap

### Planned Enhancements

- **Content Clustering**: Pillar pages + supporting article workflows
- **Team Collaboration**: Multi-user accounts with role-based access
- **Scheduled Audits**: Automatic periodic crawling with historical tracking
- **Advanced Analytics**: Cost per provider, model comparison, performance metrics
- **CMS Integrations**: HubSpot, Webflow, Contentful, Strapi support
- **Local LLM Support**: Ollama and LiteLLM proxy for privacy-focused deployments
- **API & Webhooks**: Programmatic access via REST API and event-driven workflows

See [Issues](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/issues) for community-requested features.

---

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Verify `DATABASE_URL` in `.env` is correct
- For Neon: check that the connection string includes `?sslmode=require`
- For SQLite: ensure `dev.db` is not locked by another process

**"Prisma client not generated"**
- Run `npx prisma generate` to regenerate
- Delete `node_modules/.prisma/` and reinstall dependencies

**"Google OAuth redirect URI mismatch"**
- Copy the exact URI shown in Settings → Google Search Console
- Add it to Google Cloud Console → OAuth consent screen → Authorized redirect URIs

**"AI generation token limit exceeded"**
- This is intentional for OpenRouter free tier compatibility
- Reduce word count target or content length in generation options
- Consider upgrading to a paid AI provider plan

### Getting Help

- 📖 [GitHub Issues](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/issues) — Report bugs and request features
- 💬 [GitHub Discussions](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/discussions) — Ask questions and discuss ideas
- 📧 Email: anushka.yono@gmail.com

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

You are free to use, modify, and distribute this software for personal and commercial purposes.

---

## Acknowledgments

Built with ❤️ by [KuyaMecky](https://github.com/KuyaMecky)

Special thanks to:
- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Google](https://google.com/) for Search Console API
- [Vercel](https://vercel.com/) for hosting and Next.js
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
