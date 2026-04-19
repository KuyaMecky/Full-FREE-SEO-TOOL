import type { LucideIcon } from "lucide-react";

export interface GuideStep {
  title: string;
  description: string;
}

export interface Guide {
  summary: string;
  steps: GuideStep[];
  tip?: string;
}

export const GUIDES: Record<string, Guide> = {
  dashboard: {
    summary:
      "Your cross-portfolio overview. Shows totals, per-site traction, and recent audits across every connected property.",
    steps: [
      {
        title: "Connect a property",
        description:
          "Click Properties in the sidebar and authorize Google Search Console.",
      },
      {
        title: "Fetch a snapshot",
        description:
          "Open a property and click Refresh — this pulls 28 days of impressions/clicks/queries/pages.",
      },
      {
        title: "Sort the sites table",
        description:
          "Click any column header to rank by impressions, clicks, CTR, or position.",
      },
    ],
    tip: "Average position is color-coded — green = top 10, amber = page 2, muted = deeper.",
  },
  properties: {
    summary:
      "Manage your Google Search Console connections. Each property gets its own KPI dashboard, query table, and AI suggestions.",
    steps: [
      {
        title: "Connect Google",
        description:
          "Click Connect Google Search Console and authorize with your Google account.",
      },
      {
        title: "Pick a site",
        description:
          "Use the connect picker to select one or multiple verified properties at once.",
      },
      {
        title: "Open a property",
        description:
          "Click any property card to see KPIs, trend chart, top queries/pages, and AI suggestions.",
      },
    ],
    tip: "You can bulk-add properties — select multiple sites, then click Add selected.",
  },
  quickWins: {
    summary:
      "Queries ranking positions 4-20 with real impressions — the fastest wins in your portfolio. Sorted by opportunity score (impressions × proximity to page 1).",
    steps: [
      {
        title: "Pick a query",
        description:
          "High-impression, position 11-20 queries are usually the best targets.",
      },
      {
        title: "Open the ranking page",
        description:
          "Click the site link to jump to the property dashboard and see the page ranking for that query.",
      },
      {
        title: "Run AI suggestions",
        description:
          "From the property Suggestions tab, generate title rewrites and content angles for these quick wins.",
      },
    ],
    tip: "If nothing shows up, refresh a property first to get its GSC snapshot.",
  },
  performance: {
    summary:
      "Run Google PageSpeed Insights against any URL. See Core Web Vitals, accessibility, SEO, and best-practices scores plus ranked fixes.",
    steps: [
      {
        title: "Paste a URL",
        description: "Any public URL works. https:// is auto-added if missing.",
      },
      {
        title: "Pick mobile or desktop",
        description:
          "Mobile is Google's primary ranking signal — start there.",
      },
      {
        title: "Review What to fix",
        description:
          "Issues are sorted by potential savings in seconds. Start with the biggest.",
      },
    ],
    tip: "First run takes 30-90s. Add a free API key in Settings → PageSpeed Insights for 25,000 queries/day (default anonymous quota is tight).",
  },
  keywords: {
    summary:
      "Expand seed keywords into a full plan. Primary targets, long-tail opportunities, topic clusters, and gaps — cross-referenced with your real GSC queries when the domain matches a connected property.",
    steps: [
      {
        title: "Enter your domain",
        description:
          "If it matches a connected GSC property, we automatically attach your real search query data.",
      },
      {
        title: "Add seed keywords",
        description:
          "Start with 3-5 topics your site covers. Press Enter between each.",
      },
      {
        title: "Generate plan",
        description:
          "AI returns Quick Wins (page-2 queries), primary targets, long-tail opportunities, clusters, and topic gaps.",
      },
    ],
    tip: "Quick Wins only appear when the domain matches a connected property — that's where your real ranking data lives.",
  },
  competitors: {
    summary:
      "Crawl competitor homepages and get a gap analysis. Shows themes they cover you don't, your differentiators, and specific content wins to close the gap.",
    steps: [
      {
        title: "Enter your domain",
        description: "Used as the baseline for comparison.",
      },
      {
        title: "Add competitors",
        description:
          "Up to 5 competitor domains. We crawl each homepage for titles, H1s, nav, and body copy.",
      },
      {
        title: "Analyze",
        description:
          "Get a gap list, positioning recommendations, and per-competitor strengths/weaknesses.",
      },
    ],
    tip: "Works best with 3+ competitors — more data makes the gap analysis richer.",
  },
  onpage: {
    summary:
      "Paste any URL to get a full single-page SEO report — metadata, headings, links, images, schema, readability, and actionable issues.",
    steps: [
      {
        title: "Paste a URL",
        description: "Any public page — your own or a competitor's.",
      },
      {
        title: "Review the score",
        description:
          "0-100, deducted by issue severity (high = -15, medium = -8, low = -3).",
      },
      {
        title: "Fix top issues",
        description:
          "Issues are tagged by category (meta/content/links/etc) and severity.",
      },
    ],
    tip: "Good for ad-hoc checks. For a full-site crawl with scoring + AI report, use New Audit instead.",
  },
  indexing: {
    summary:
      "See which pages are indexed, deep-inspect any URL via Google's URL Inspection API, and track submissions over time.",
    steps: [
      {
        title: "Pick a property",
        description:
          "Indexing tools are tied to verified Search Console properties.",
      },
      {
        title: "Inspect URL",
        description:
          "Check any single URL's indexing verdict, canonical, mobile usability, and rich results.",
      },
      {
        title: "Submit & track",
        description:
          "Use Open in GSC to request indexing, mark the row as requested, then re-check from here to watch the status flip to Indexed.",
      },
    ],
    tip: "Google's Indexing API is JobPosting/BroadcastEvent only. For other pages, the Search Console UI is the supported path — we deep-link you there in one click.",
  },
  schemaCheck: {
    summary:
      "Fetch any URL's JSON-LD and validate required + recommended fields for 14 common schema.org types. Also detects microdata and RDFa.",
    steps: [
      {
        title: "Paste a URL",
        description: "We fetch the HTML and extract every JSON-LD block.",
      },
      {
        title: "Review issues",
        description:
          "Errors = missing required fields (likely breaks rich results). Warnings = missing recommended fields.",
      },
      {
        title: "Check recommended types",
        description:
          "We suggest schema types typically expected for the page type (e.g. Organization + WebSite on homepages).",
      },
    ],
    tip: "Always validate with Google's Rich Results Test before shipping — we check structure, they check eligibility for specific SERP features.",
  },
  schemaGen: {
    summary:
      "Build valid JSON-LD for 6 common schema.org types. Fill the form, copy the output, paste into a <script> tag in your page head.",
    steps: [
      {
        title: "Pick a type",
        description:
          "Article, FAQ, Product, LocalBusiness, Organization, or Breadcrumb.",
      },
      {
        title: "Fill fields",
        description:
          "Only fields with values are included in the output — empty ones are omitted.",
      },
      {
        title: "Copy + validate",
        description:
          "Use the Copy button, then paste your output into Google's Rich Results Test.",
      },
    ],
    tip: "Put the <script type=\"application/ld+json\"> in your page <head>, not <body>.",
  },
  backlinks: {
    summary:
      "Analyze your Google Search Console backlinks export. Data stays in your browser — no upload to any server. Click any connected property to jump straight to its GSC Links page.",
    steps: [
      {
        title: "Open in Search Console",
        description:
          "Click a property tile → it opens that property's Links page in a new tab.",
      },
      {
        title: "Export External links",
        description:
          "In GSC, click Export External links (top-right). You get 3 CSVs — top linking sites, pages, and anchor text.",
      },
      {
        title: "Upload + explore",
        description:
          "Drop the CSVs on this page. Files are auto-classified and aggregated into sortable tables.",
      },
    ],
    tip: "GSC's backlinks data has no public API — CSV export is the only supported path. Tools like Ahrefs/Majestic cost $50+/month for live data.",
  },
  auditNew: {
    summary:
      "Run a full-site SEO audit. We crawl up to 50 pages, run 9 specialized analyzers, score the site, and generate an AI executive summary + 30/60/90 day roadmap.",
    steps: [
      {
        title: "Enter domain + context",
        description:
          "Business type, priority pages, and competitors help the AI produce a more relevant report.",
      },
      {
        title: "Wait for crawl",
        description:
          "Typically 2-5 minutes for 50 pages. Progress streams live.",
      },
      {
        title: "Open the audit",
        description:
          "Review findings, Performance (CWV), Keywords, Competitors, Roadmap, and Actions tabs.",
      },
    ],
    tip: "Priority pages get deeper PageSpeed analysis. Competitors + seed keywords drive the AI research tabs.",
  },
  history: {
    summary:
      "All your past audits. Click any row to re-open the full report.",
    steps: [
      {
        title: "Find the audit",
        description: "Sorted newest-first.",
      },
      {
        title: "Re-open",
        description:
          "Click to see the same summary, findings, roadmap, and action items you had before.",
      },
      {
        title: "Delete if done",
        description:
          "Trash icon removes the audit + all crawl results and findings.",
      },
    ],
  },
  settings: {
    summary:
      "Configure external integrations. Everything saves to your local database — no server restart needed.",
    steps: [
      {
        title: "Google Search Console",
        description:
          "Create an OAuth client in Google Cloud, paste the ID + secret. One-time setup.",
      },
      {
        title: "AI Provider",
        description:
          "Pick Anthropic / OpenAI / Gemini / OpenRouter. OpenRouter has a one-click PKCE sign-in.",
      },
      {
        title: "PageSpeed Insights",
        description:
          "Get a free Google API key for 25,000 PSI queries/day instead of the shared anonymous quota.",
      },
    ],
  },
  settingsGoogle: {
    summary:
      "One-time Google Cloud OAuth setup so anyone on this install can connect their Search Console property.",
    steps: [
      {
        title: "Create Google Cloud project",
        description:
          "Enable the Search Console API, configure the OAuth consent screen (External, add yourself as a test user).",
      },
      {
        title: "Create OAuth client",
        description:
          "Web application type. Paste the redirect URI shown below into the Authorized redirect URIs field.",
      },
      {
        title: "Paste credentials here",
        description:
          "Client ID + Client Secret. Stored in the local DB — no .env editing needed.",
      },
    ],
    tip: "The redirect URI has to match exactly — copy it from this page.",
  },
  settingsAi: {
    summary:
      "Pick which LLM powers audit reports, keyword research, competitor analysis, and GSC suggestions. Keys are stored per provider — you can switch without losing saved keys.",
    steps: [
      {
        title: "Pick a provider",
        description:
          "Anthropic Claude and Google Gemini have generous free tiers. OpenRouter gives you access to many models through one key.",
      },
      {
        title: "Save an API key",
        description:
          "OpenRouter offers PKCE sign-in (one click, no copy-paste). Others require pasting a key from the provider's console.",
      },
      {
        title: "Override model (optional)",
        description:
          "Defaults are Claude Sonnet 4.6, GPT-5, Gemini 2.5 Pro, or Claude Sonnet 4.5 via OpenRouter.",
      },
    ],
    tip: "The selected provider is used for ALL AI calls across the app.",
  },
  content: {
    summary:
      "AI content planner. Pick a property to generate new content ideas from your sitemap + GSC data, or paste a URL to get a concrete refresh plan for an existing post.",
    steps: [
      {
        title: "Pick a property",
        description:
          "We pull your existing URLs from the sitemap and pair them with GSC queries so ideas don't duplicate what you have.",
      },
      {
        title: "Generate ideas",
        description:
          "Quick wins come from page-2 queries. Topic expansions build on existing URLs. New pillars are brand-new topic areas.",
      },
      {
        title: "Refresh existing posts",
        description:
          "Switch to the Recreate tab, paste any URL, and get a concrete plan — what to add, cut, rewrite, which keywords to re-target.",
      },
    ],
    tip: "Already-published URLs are stripped from idea suggestions so you never get a duplicate.",
  },

  settingsPagespeed: {
    summary:
      "A free Google PageSpeed Insights API key upgrades your daily quota from the shared anonymous limit to 25,000 queries — no credit card required.",
    steps: [
      {
        title: "Open the getting-started page",
        description:
          "Click the link below. You'll sign in with your Google account.",
      },
      {
        title: "Get a Key",
        description:
          "Google creates a Cloud project for you and shows the new API key immediately. It starts with AIza…",
      },
      {
        title: "Paste it here",
        description:
          "Saved to the local DB. Used automatically for all Performance and Core Web Vitals calls.",
      },
    ],
    tip: "The key is bound to the PSI API only — it can't be used for billable services.",
  },
};

export type GuideKey = keyof typeof GUIDES;
