export interface AuditConfig {
  domain: string;
  country: string;
  language: string;
  businessType: string;
  goals: string[];
  priorityPages: string[];
  competitors: string[];
  cmsStack: string;
  maxPages: number;
}

export interface CrawlPageResult {
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

export interface CrawlProgress {
  totalPages: number;
  crawledPages: number;
  currentUrl: string;
  status: "crawling" | "complete" | "error";
  errors: string[];
}

export interface ScoreCard {
  overall: number;
  technical: number;
  onPage: number;
  content: number;
  uxPerformance: number;
}

export interface FindingData {
  category: "technical" | "on-page" | "content" | "ux-performance";
  issue: string;
  evidence: string;
  affectedUrls: string[];
  severity: "critical" | "high" | "medium" | "low";
  impact: string;
  recommendedFix: string;
  owner: string;
  effort: string;
  priority: number;
}

export interface ExecutiveSummary {
  overview: string;
  keyFindings: string[];
  topOpportunities: string[];
  riskAreas: string[];
}

export interface RoadmapItem {
  phase: "30-day" | "60-day" | "90-day";
  task: string;
  owner: string;
  priority: "high" | "medium" | "low";
  expectedImpact: string;
}

export interface KpiTarget {
  metric: string;
  current: string;
  target30: string;
  target60: string;
  target90: string;
}

export interface ActionItem {
  rank: number;
  action: string;
  impact: string;
  effort: string;
  owner: string;
}

export interface AuditReportData {
  executiveSummary: ExecutiveSummary;
  scorecard: ScoreCard;
  roadmap: RoadmapItem[];
  kpiPlan: KpiTarget[];
  actionItems: ActionItem[];
  stakeholderSummary: string;
  devTaskList: DevTask[];
}

export interface DevTask {
  task: string;
  priority: "high" | "medium" | "low";
  effort: string;
  details: string;
}
