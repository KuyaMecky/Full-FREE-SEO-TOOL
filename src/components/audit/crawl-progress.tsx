"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface CrawlProgressData {
  totalPages: number;
  crawledPages: number;
  currentUrl: string;
  status: "crawling" | "complete" | "error";
  errors: string[];
}

interface CrawlProgressProps {
  auditId: string;
  onComplete?: () => void;
}

export function CrawlProgress({ auditId, onComplete }: CrawlProgressProps) {
  const [progress, setProgress] = useState<CrawlProgressData>({
    totalPages: 50,
    crawledPages: 0,
    currentUrl: "Initializing...",
    status: "crawling",
    errors: [],
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Use SSE for real-time updates
    const eventSource = new EventSource(`/api/crawl/progress?auditId=${auditId}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error("SSE error:", data.error);
          return;
        }
        setProgress(data);

        if (data.status === "complete" || data.status === "error") {
          eventSource.close();
          if (data.status === "complete") {
            onComplete?.();
          }
        }
      } catch (error) {
        console.error("Failed to parse SSE data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setConnected(false);
      eventSource.close();

      // Fallback to polling
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/crawl?auditId=${auditId}`);
          if (res.ok) {
            const data = await res.json();
            setProgress(data.progress);

            if (
              data.progress.status === "complete" ||
              data.progress.status === "error"
            ) {
              clearInterval(pollInterval);
              if (data.progress.status === "complete") {
                onComplete?.();
              }
            }
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    };

    return () => {
      eventSource.close();
    };
  }, [auditId, onComplete]);

  const percentage = Math.round(
    (progress.crawledPages / progress.totalPages) * 100
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {progress.status === "crawling" && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
          {progress.status === "complete" && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {progress.status === "error" && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          Crawling Website
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {progress.crawledPages} of {progress.totalPages} pages
            </span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Current URL:</p>
          <p className="text-sm font-mono truncate text-gray-700">
            {progress.currentUrl}
          </p>
        </div>

        {!connected && progress.status === "crawling" && (
          <p className="text-xs text-gray-400">
            Using polling fallback...
          </p>
        )}

        {progress.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              {progress.errors.length} error(s) occurred. Some pages may not have
              been crawled.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
