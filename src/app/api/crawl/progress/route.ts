import { NextRequest } from "next/server";
import { activeCrawls } from "@/lib/crawl-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auditId = searchParams.get("auditId");

  if (!auditId) {
    return new Response(
      `data: ${JSON.stringify({ error: "Audit ID required" })}\n\n`,
      {
        status: 400,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      const sendProgress = () => {
        const crawl = activeCrawls.get(auditId);
        if (crawl) {
          controller.enqueue(
            `data: ${JSON.stringify(crawl.progress)}\n\n`
          );

          if (crawl.progress.status === "complete" || crawl.progress.status === "error") {
            controller.close();
          }
        } else {
          // Check if crawl finished recently
          controller.enqueue(
            `data: ${JSON.stringify({
              totalPages: 0,
              crawledPages: 0,
              currentUrl: "Checking status...",
              status: "crawling",
              errors: [],
            })}\n\n`
          );
        }
      };

      // Send initial progress
      sendProgress();

      // Poll every 1 second
      const interval = setInterval(() => {
        const crawl = activeCrawls.get(auditId);
        sendProgress();

        if (!crawl || crawl.progress.status === "complete" || crawl.progress.status === "error") {
          clearInterval(interval);
          // Wait a bit then close
          setTimeout(() => controller.close(), 2000);
        }
      }, 1000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
