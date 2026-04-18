import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUrl(url: string, base: string): string {
  try {
    const parsed = new URL(url, base);
    // Remove fragment
    parsed.hash = "";
    // Remove trailing slash for consistency (except root)
    let normalized = parsed.href;
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return "";
  }
}

export function isSameDomain(url: string, domain: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === domain || parsed.hostname === `www.${domain}` || `www.${parsed.hostname}` === domain;
  } catch {
    return false;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function formatDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
    domain = `https://${domain}`;
  }
  try {
    const url = new URL(domain);
    return url.origin;
  } catch {
    return "";
  }
}

export function severityOrder(severity: string): number {
  switch (severity) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "low": return 3;
    default: return 4;
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
