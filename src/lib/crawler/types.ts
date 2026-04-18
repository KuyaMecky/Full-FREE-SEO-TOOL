export interface CrawlOptions {
  maxPages: number;
  concurrentRequests: number;
  requestDelay: number;
  respectRobotsTxt: boolean;
  userAgent: string;
}

export interface CrawlContext {
  baseUrl: URL;
  crawledUrls: Set<string>;
  urlQueue: string[];
  options: CrawlOptions;
  results: PageAnalysis[];
  errors: string[];
  onProgress?: (progress: CrawlProgress) => void;
}

export interface CrawlProgress {
  totalPages: number;
  crawledPages: number;
  currentUrl: string;
  status: "crawling" | "complete" | "error";
  errors: string[];
}

export interface PageAnalysis {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  headings: HeadingInfo[];
  links: LinkInfo[];
  images: ImageInfo[];
  structuredData: StructuredDataItem[];
  issues: PageIssue[];
  responseTime: number;
  contentLength: number;
  robotsMeta: string;
}

export interface HeadingInfo {
  level: number;
  text: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  isInternal: boolean;
  isNoFollow: boolean;
  statusCode?: number;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  width?: number;
  height?: number;
}

export interface StructuredDataItem {
  type: string;
  data: Record<string, unknown>;
}

export interface PageIssue {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  details?: string;
}

// Import type for cheerio
type CheerioAPI = import("cheerio").CheerioAPI;

export interface Analyzer {
  name: string;
  analyze: (html: string, $: CheerioAPI, url: string, context: CrawlContext) => PageIssue[];
}
