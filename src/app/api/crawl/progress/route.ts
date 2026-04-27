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
      let lastUpdate = Date.now();

      const sendProgress = () => {
        const crawl = activeCrawls.get(auditId);
        if (crawl) {
          const progress = crawl.progress;
          lastUpdate = Date.now();

          controller.enqueue(
            `data: ${JSON.stringify(progress)}\n\n`
          );

          if (progress.status === "complete" || progress.status === "error") {
            setTimeout(() => controller.close(), 1000);
            return true; // Signal to close interval
          }
        } else {
          // Still waiting for crawl to start or already finished
          const now = Date.now();
          if (now - lastUpdate > 5000) {
            // Send heartbeat if no updates in 5 seconds
            controller.enqueue(
              `data: ${JSON.stringify({
                totalPages: 0,
                crawledPages: 0,
                currentUrl: "Waiting for crawl...",
                status: "crawling",
                errors: [],
              })}\n\n`
            );
          }
        }
        return false;
      };

      // Send initial progress
      sendProgress();

      // Poll every 500ms for faster updates
      const interval = setInterval(() => {
        if (sendProgress()) {
          clearInterval(interval);
        }
      }, 500);

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
