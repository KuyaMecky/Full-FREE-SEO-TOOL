import { CrawlContext, PageAnalysis } from "./types";

interface FetchResult {
  html: string;
  statusCode: number;
  responseTime: number;
  contentLength: number;
  error?: string;
}

export async function fetchPage(
  url: string,
  options: CrawlContext["options"]
): Promise<FetchResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": options.userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;
    const contentLength = Number(response.headers.get("content-length")) || 0;

    // Check for non-HTML content
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return {
        html: "",
        statusCode: response.status,
        responseTime,
        contentLength,
        error: `Non-HTML content type: ${contentType}`,
      };
    }

    const html = await response.text();

    return {
      html,
      statusCode: response.status,
      responseTime,
      contentLength,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return {
      html: "",
      statusCode: 0,
      responseTime,
      contentLength: 0,
      error: errorMessage,
    };
  }
}

export async function checkLinkStatus(
  url: string,
  userAgent: string
): Promise<number> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout for link checks

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": userAgent,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.status;
  } catch {
    return 0;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
