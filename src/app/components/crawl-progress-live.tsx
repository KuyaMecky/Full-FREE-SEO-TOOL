'use client';

import { useEffect, useState } from 'react';
import { AdvancedTerminal } from './terminal-advanced';
import { LinearProgress } from './status-indicators';

interface CrawlProgress {
  totalPages: number;
  crawledPages: number;
  currentUrl: string;
  status: 'crawling' | 'analyzing' | 'complete' | 'error';
  errors: string[];
}

interface CrawlProgressLiveProps {
  auditId: string;
  onComplete?: (status: string) => void;
}

export function CrawlProgressLive({ auditId, onComplete }: CrawlProgressLiveProps) {
  const [progress, setProgress] = useState<CrawlProgress>({
    totalPages: 0,
    crawledPages: 0,
    currentUrl: 'Starting crawl...',
    status: 'crawling',
    errors: [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const [timeout, setTimeout] = useState(false);

  useEffect(() => {
    // Connect to Server-Sent Events stream
    const eventSource = new EventSource(`/api/crawl/progress?auditId=${auditId}`);
    let timeoutId: NodeJS.Timeout;
    let hasData = false;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!hasData) {
          setTimeout(true);
          eventSource.close();
        }
      }, 60000); // 60 second timeout
    };

    eventSource.onopen = () => {
      setIsConnected(true);
      resetTimeout();
    };

    eventSource.onmessage = (event) => {
      hasData = true;
      setTimeout(false);
      const data = JSON.parse(event.data);
      setProgress(data);
      resetTimeout();

      // Call callback when complete
      if (data.status === 'complete' || data.status === 'error') {
        onComplete?.(data.status);
        eventSource.close();
        clearTimeout(timeoutId);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      clearTimeout(timeoutId);
    };

    return () => {
      eventSource.close();
      clearTimeout(timeoutId);
    };
  }, [auditId, onComplete]);

  const percentage =
    progress.totalPages > 0
      ? Math.round((progress.crawledPages / progress.totalPages) * 100)
      : 0;

  const statusMessages = {
    crawling: 'Crawling website...',
    analyzing: 'Analyzing pages...',
    complete: 'Crawl completed!',
    error: 'Crawl failed',
  };

  const lines = [
    `Pages crawled: ${progress.crawledPages}/${progress.totalPages}`,
    `Current page: ${progress.currentUrl}`,
    progress.errors.length > 0
      ? `Errors found: ${progress.errors.length}`
      : 'No errors',
    `Status: ${progress.status.toUpperCase()}`,
  ];

  return (
    <div className="space-y-4">
      {/* Advanced terminal showing real-time progress */}
      <AdvancedTerminal
        message={statusMessages[progress.status]}
        color={progress.status === 'error' ? 'red' : progress.status === 'complete' ? 'green' : 'cyan'}
        showProgress
        progress={percentage}
        lines={lines}
      />

      {/* Additional progress details */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
        {/* Progress bar */}
        <LinearProgress
          progress={percentage}
          label="Crawl Progress"
          color={progress.status === 'error' ? 'red' : progress.status === 'complete' ? 'green' : 'blue'}
        />

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Pages Crawled</p>
            <p className="text-gray-100 font-mono text-lg">
              {progress.crawledPages} / {progress.totalPages}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Progress</p>
            <p className="text-gray-100 font-mono text-lg">{percentage}%</p>
          </div>
          {progress.errors.length > 0 && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs">Errors</p>
              <div className="text-red-400 text-xs space-y-1 max-h-20 overflow-y-auto">
                {progress.errors.slice(0, 3).map((error, i) => (
                  <div key={i} className="truncate">• {error}</div>
                ))}
                {progress.errors.length > 3 && (
                  <div className="text-gray-500">+{progress.errors.length - 3} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
          <span className="text-xs text-gray-400">Status</span>
          <span
            className={`text-xs font-mono px-2 py-1 rounded ${
              progress.status === 'complete'
                ? 'bg-green-500/20 text-green-400'
                : progress.status === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {progress.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Connection status */}
      {!isConnected && !timeout && (
        <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-700/30 rounded px-3 py-2">
          ⚠️ Connection lost. Trying to reconnect...
        </div>
      )}

      {/* Timeout message */}
      {timeout && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-700/30 rounded px-3 py-2">
          ⚠️ Crawl timeout. The website might be slow to crawl. You can check the audit page directly or try again.
        </div>
      )}
    </div>
  );
}
