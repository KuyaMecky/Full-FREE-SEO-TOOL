import { CrawlProgress } from "./crawler/types";

// Store active crawls (shared between API routes)
export const activeCrawls = new Map<
  string,
  {
    progress: CrawlProgress;
    abortController: AbortController;
  }
>();

export function getCrawlProgress(auditId: string) {
  return activeCrawls.get(auditId);
}

export function setCrawlProgress(
  auditId: string,
  data: {
    progress: CrawlProgress;
    abortController: AbortController;
  }
) {
  activeCrawls.set(auditId, data);
}

export function deleteCrawlProgress(auditId: string) {
  activeCrawls.delete(auditId);
}
