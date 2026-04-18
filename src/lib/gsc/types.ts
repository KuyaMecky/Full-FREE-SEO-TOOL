export interface GscRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSearchAnalyticsResponse {
  rows?: GscRow[];
  responseAggregationType?: string;
}

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscSitesResponse {
  siteEntry?: GscSite[];
}

export interface DateRow {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface QueryRow {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface PageRow {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SnapshotData {
  rangeStart: string;
  rangeEnd: string;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
  byDate: DateRow[];
  byQuery: QueryRow[];
  byPage: PageRow[];
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserinfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}
