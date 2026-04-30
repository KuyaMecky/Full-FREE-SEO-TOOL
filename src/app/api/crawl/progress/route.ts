import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { activeCrawls } from "@/lib/crawl-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auditId = searchParams.get("auditId");

  if (!auditId) {
    return new Response("Audit ID is required", { status: 400 });
  }

  // Create a response stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({ status: "connected" })}\n\n`
        );

        // Function to send progress updates
        const sendProgress = async () => {
          try {
            // Try in-memory store first (local dev)
            const crawl = activeCrawls.get(auditId);
            if (crawl) {
              controller.enqueue(
                `data: ${JSON.stringify(crawl.progress)}\n\n`
              );

              // Check if crawl is complete
              if (
                crawl.progress.status === "complete" ||
                crawl.progress.status === "error"
              ) {
                controller.close();
                return true;
              }
            } else {
              // Fall back to database
              const audit = await prisma.audit.findUnique({
                where: { id: auditId },
                select: { crawlProgress: true, status: true },
              });

              if (audit?.crawlProgress && audit.crawlProgress !== "{}") {
                const progress = JSON.parse(audit.crawlProgress);
                controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`);

                if (
                  audit.status === "complete" ||
                  audit.status === "error"
                ) {
                  controller.close();
                  return true;
                }
              }
            }

            return false;
          } catch (error) {
            console.error("Error sending progress:", error);
            return false;
          }
        };

        // Poll for updates every 500ms
        const pollInterval = setInterval(async () => {
          const isComplete = await sendProgress();
          if (isComplete) {
            clearInterval(pollInterval);
          }
        }, 500);

        // Initial progress
        await sendProgress();

        // Clean up on disconnect
        return () => {
          clearInterval(pollInterval);
        };
      } catch (error) {
        console.error("Stream error:", error);
        controller.close();
      }
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
