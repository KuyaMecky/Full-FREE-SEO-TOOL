"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Copy } from "lucide-react";

export default function SharedAuditPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReport();
  }, [slug]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/audit/share/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Report not found or has expired");
        } else {
          setError("Failed to load report");
        }
        return;
      }

      const data = await res.json();
      setHtml(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const downloadHTML = () => {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(html));
    element.setAttribute("download", `seo-audit-${slug}.html`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Loading audit report...</div>
        </div>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-400">{error || "Report not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-400">SEO Audit Report</div>
          <div className="flex gap-2">
            <Button
              onClick={copyLink}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? "Copied" : "Share Link"}
            </Button>
            <Button
              onClick={downloadHTML}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Report Container */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
