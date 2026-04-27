'use client';

import { useEffect, useRef } from 'react';

export default function AutomationPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // n8n will be available at /n8n
    if (iframeRef.current) {
      iframeRef.current.src = '/n8n';
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold">n8n Automation</h1>
        <p className="text-sm text-gray-400 mt-1">
          Create and manage automated workflows triggered by SEO audits
        </p>
      </div>

      {/* n8n Embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="n8n Automation"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
        />
      </div>
    </div>
  );
}
