export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface SitemapFetchResult {
  sitemapUrls: string[]; // urls of sitemap files discovered
  entries: SitemapEntry[];
  errors: string[];
}

const USER_AGENT = "SEO-Audit-Bot/1.0 (content planner)";
const MAX_SITEMAPS = 10;
const MAX_ENTRIES = 500;

/**
 * Strip XML tag and return inner text (very small, no deps).
 */
function between(text: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

function extractEntries(xml: string): SitemapEntry[] {
  const urlBlocks = between(xml, "url");
  return urlBlocks
    .map((block) => {
      const loc = between(block, "loc")[0];
      if (!loc) return null;
      const lastmod = between(block, "lastmod")[0];
      const changefreq = between(block, "changefreq")[0];
      const priorityStr = between(block, "priority")[0];
      const priority = priorityStr ? parseFloat(priorityStr) : undefined;
      return {
        url: loc.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
        lastmod: lastmod || undefined,
        changefreq: changefreq || undefined,
        priority: Number.isFinite(priority) ? priority : undefined,
      } as SitemapEntry;
    })
    .filter((e): e is SitemapEntry => Boolean(e));
}

function extractSitemapIndex(xml: string): string[] {
  const smBlocks = between(xml, "sitemap");
  return smBlocks
    .map((block) => between(block, "loc")[0])
    .filter(Boolean)
    .map((u) => u.replace(/<!\[CDATA\[|\]\]>/g, "").trim());
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/xml,text/xml,*/*",
    },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * Resolve a property's sitemap URL from the site URL.
 * GSC properties come in two forms:
 *   - "sc-domain:example.com" → try https://example.com/sitemap.xml
 *   - "https://example.com/" → try appending sitemap.xml
 */
function candidateSitemapUrls(siteUrl: string): string[] {
  if (siteUrl.startsWith("sc-domain:")) {
    const host = siteUrl.slice("sc-domain:".length);
    return [
      `https://${host}/sitemap.xml`,
      `https://${host}/sitemap_index.xml`,
      `https://www.${host}/sitemap.xml`,
    ];
  }
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`];
}

/**
 * Fetch sitemap(s) for a property. Follows sitemap index files up to MAX_SITEMAPS.
 * Caps entries at MAX_ENTRIES.
 */
export async function fetchSitemapForProperty(
  siteUrl: string
): Promise<SitemapFetchResult> {
  const errors: string[] = [];
  const visitedSitemaps = new Set<string>();
  const allEntries: SitemapEntry[] = [];

  const queue: string[] = [];

  for (const candidate of candidateSitemapUrls(siteUrl)) {
    try {
      await fetch(candidate, {
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8_000),
      });
      queue.push(candidate);
      break;
    } catch {
      // try next candidate
    }
  }

  if (queue.length === 0) {
    // Couldn't HEAD; still try GET on the first candidate as last resort
    queue.push(candidateSitemapUrls(siteUrl)[0]);
  }

  while (queue.length > 0 && visitedSitemaps.size < MAX_SITEMAPS) {
    const current = queue.shift()!;
    if (visitedSitemaps.has(current)) continue;
    visitedSitemaps.add(current);

    try {
      const xml = await fetchText(current);
      // Detect sitemap-index vs urlset
      if (xml.includes("<sitemapindex")) {
        const childUrls = extractSitemapIndex(xml);
        for (const u of childUrls) {
          if (!visitedSitemaps.has(u) && visitedSitemaps.size + queue.length < MAX_SITEMAPS) {
            queue.push(u);
          }
        }
      } else {
        const entries = extractEntries(xml);
        for (const e of entries) {
          if (allEntries.length >= MAX_ENTRIES) break;
          allEntries.push(e);
        }
      }
    } catch (err) {
      errors.push(
        `${current}: ${err instanceof Error ? err.message : "fetch failed"}`
      );
    }
  }

  return {
    sitemapUrls: Array.from(visitedSitemaps),
    entries: allEntries,
    errors,
  };
}
