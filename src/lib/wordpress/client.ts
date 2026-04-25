export interface WpPost {
  id: number;
  link: string;
  status: string;
}

export interface WpCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WpTag {
  id: number;
  name: string;
  slug: string;
}

export interface PublishOptions {
  title: string;
  content: string;
  slug: string;
  status: "draft" | "publish";
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  categoryIds?: number[];
  tagIds?: number[];
  featuredMediaId?: number;
}

function authHeader(username: string, appPassword: string): string {
  return "Basic " + Buffer.from(`${username}:${appPassword}`).toString("base64");
}

function apiBase(siteUrl: string): string {
  return siteUrl.replace(/\/$/, "") + "/wp-json/wp/v2";
}

export async function testConnection(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{ ok: boolean; error?: string; displayName?: string }> {
  try {
    const res = await fetch(`${apiBase(siteUrl)}/users/me`, {
      headers: {
        Authorization: authHeader(username, appPassword),
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
    }
    const data = await res.json();
    return { ok: true, displayName: data.name ?? username };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Connection failed" };
  }
}

export async function getCategories(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WpCategory[]> {
  const res = await fetch(`${apiBase(siteUrl)}/categories?per_page=100`, {
    headers: { Authorization: authHeader(username, appPassword) },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getTags(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WpTag[]> {
  const res = await fetch(`${apiBase(siteUrl)}/tags?per_page=100`, {
    headers: { Authorization: authHeader(username, appPassword) },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createPost(
  siteUrl: string,
  username: string,
  appPassword: string,
  opts: PublishOptions
): Promise<WpPost> {
  const meta: Record<string, string> = {};

  // Yoast SEO
  if (opts.metaTitle) meta["_yoast_wpseo_title"] = opts.metaTitle;
  if (opts.metaDescription) meta["_yoast_wpseo_metadesc"] = opts.metaDescription;
  if (opts.focusKeyword) meta["_yoast_wpseo_focuskw"] = opts.focusKeyword;

  // Rank Math
  if (opts.metaTitle) meta["rank_math_title"] = opts.metaTitle;
  if (opts.metaDescription) meta["rank_math_description"] = opts.metaDescription;
  if (opts.focusKeyword) meta["rank_math_focus_keyword"] = opts.focusKeyword;

  const body: Record<string, unknown> = {
    title: opts.title,
    content: opts.content,
    slug: opts.slug,
    status: opts.status,
    meta,
  };
  if (opts.categoryIds?.length) body.categories = opts.categoryIds;
  if (opts.tagIds?.length) body.tags = opts.tagIds;
  if (opts.featuredMediaId) body.featured_media = opts.featuredMediaId;

  const res = await fetch(`${apiBase(siteUrl)}/posts`, {
    method: "POST",
    headers: {
      Authorization: authHeader(username, appPassword),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WordPress API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

export async function updatePost(
  siteUrl: string,
  username: string,
  appPassword: string,
  postId: number,
  opts: Partial<PublishOptions>
): Promise<WpPost> {
  const meta: Record<string, string> = {};
  if (opts.metaTitle) {
    meta["_yoast_wpseo_title"] = opts.metaTitle;
    meta["rank_math_title"] = opts.metaTitle;
  }
  if (opts.metaDescription) {
    meta["_yoast_wpseo_metadesc"] = opts.metaDescription;
    meta["rank_math_description"] = opts.metaDescription;
  }
  if (opts.focusKeyword) {
    meta["_yoast_wpseo_focuskw"] = opts.focusKeyword;
    meta["rank_math_focus_keyword"] = opts.focusKeyword;
  }

  const body: Record<string, unknown> = { meta };
  if (opts.title) body.title = opts.title;
  if (opts.content) body.content = opts.content;
  if (opts.status) body.status = opts.status;

  const res = await fetch(`${apiBase(siteUrl)}/posts/${postId}`, {
    method: "PUT",
    headers: {
      Authorization: authHeader(username, appPassword),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WordPress API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}
