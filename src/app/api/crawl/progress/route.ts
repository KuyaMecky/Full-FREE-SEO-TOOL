import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { activeCrawls } from "@/lib/crawl-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auditId = searchParams.get("auditId");

  if (!auditId) {
    return new Response("Audit ID is required", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let pollInterval: NodeJS.Timeout;

      const sendProgress = async () => {
        if (isClosed) return true;

        try {
          const crawl = activeCrawls.get(auditId);
          if (crawl) {
            controller.enqueue(
              `data: ${JSON.stringify(crawl.progress)}\n\n`
            );

            if (
              crawl.progress.status === "complete" ||
              crawl.progress.status === "error"
            ) {
              isClosed = true;
              controller.close();
              return true;
            }
          } else {
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
                isClosed = true;
                controller.close();
                return true;
              }
            }
          }

          return false;
        } catch (error) {
          if (!isClosed) {
            console.error("Error sending progress:", error);
          }
          return false;
        }
      };

      try {
        // Send initial connection
        controller.enqueue(
          `data: ${JSON.stringify({ status: "connected" })}\n\n`
        );

        // Initial check
        const isComplete = await sendProgress();

        if (!isComplete) {
          pollInterval = setInterval(async () => {
            const complete = await sendProgress();
            if (complete) {
              clearInterval(pollInterval);
            }
          }, 500);
        }

        return () => {
          isClosed = true;
          if (pollInterval) clearInterval(pollInterval);
        };
      } catch (error) {
        console.error("Stream startup error:", error);
        isClosed = true;
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
