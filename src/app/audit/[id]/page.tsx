"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CrawlProgress } from "@/components/audit/crawl-progress";
import { HealthScorecard } from "@/components/audit/health-scorecard";
import { ExecutiveSummary } from "@/components/audit/executive-summary";
import { FindingsTable } from "@/components/audit/findings-table";
import { Roadmap } from "@/components/audit/roadmap";
import { ActionItems } from "@/components/audit/action-items";
import { PerformanceTab } from "@/components/audit/performance-tab";
import { KeywordsTab } from "@/components/audit/keywords-tab";
import { CompetitorsTab } from "@/components/audit/competitors-tab";
import { SuggestionsTab } from "@/components/audit/suggestions-tab";
import { FileText, RefreshCw, AlertCircle, Share2, Check, Copy } from "lucide-react";

interface AuditData {
  id: string;
  domain: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  crawlResults: any[];
  findings: any[];
  report: {
    executiveSummary: any;
    scorecard: any;
    roadmap: any[];
    kpiPlan: any[];
    actionItems: any[];
    stakeholderSummary: string;
    devTaskList: any[];
  } | null;
  errorMessage?: string;
}

export default function AuditDashboardPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAudit = async () => {
    try {
      const res = await fetch(`/api/audit/${auditId}`);
      if (res.ok) {
        const data = await res.json();
        setAudit(data);
      } else {
        setError("Failed to load audit");
      }
    } catch (err) {
      setError("Failed to load audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [auditId]);

  // Auto-refresh for pending/crawling/analyzing states
  useEffect(() => {
    if (
      audit?.status === "pending" ||
      audit?.status === "crawling" ||
      audit?.status === "analyzing"
    ) {
      const interval = setInterval(fetchAudit, 5000);
      return () => clearInterval(interval);
    }
  }, [audit?.status]);

  const startCrawl = async () => {
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });

      if (res.ok) {
        fetchAudit();
      }
    } catch (err) {
      console.error("Failed to start crawl:", err);
    }
  };

  const toggleShare = async () => {
    try {
      setSharing(true);
      const res = await fetch("/api/audit/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          action: shareLink ? "delete" : "create",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShareLink(data.shareLink || "");
      }
    } catch (err) {
      console.error("Failed to toggle share:", err);
    } finally {
      setSharing(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium">{error || "Audit not found"}</h3>
            <Link href="/history">
              <Button className="mt-4">View Audit History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCrawling = audit.status === "crawling";
  const isAnalyzing = audit.status === "analyzing";
  const isComplete = audit.status === "complete";
  const isError = audit.status === "error";
  const isPending = audit.status === "pending";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Audit: {audit.domain}
            </h1>
            <p className="text-muted-foreground mt-1">
              Started {new Date(audit.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {isComplete && (
              <>
                <Button
                  onClick={toggleShare}
                  disabled={sharing}
                  variant="outline"
                  className="gap-2"
                  title={shareLink ? "Click to disable sharing" : "Click to generate shareable link"}
                >
                  <Share2 className="h-4 w-4" />
                  {sharing ? "..." : shareLink ? "Shared" : "Share"}
                </Button>
                {shareLink && (
                  <Button
                    onClick={copyShareLink}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </>
                    )}
                  </Button>
                )}
                <Link href={`/audit/${auditId}/pdf`}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>
                </Link>
              </>
            )}
            {(isError || isPending) && (
              <Button onClick={startCrawl} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {isError ? "Retry Audit" : "Start Crawl"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {(isCrawling || isAnalyzing) && (
        <div className="mb-8">
          <CrawlProgress
            auditId={auditId}
            onComplete={fetchAudit}
          />
        </div>
      )}

      {isError && (
        <Card className="mb-8 border-red-200">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{audit.errorMessage || "An error occurred during the audit"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isComplete && audit.report && (
        <>
          <div className="mb-8">
            <HealthScorecard scorecard={audit.report.scorecard} />
          </div>

          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="findings">Findings ({audit.findings.length})</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <ExecutiveSummary summary={audit.report.executiveSummary} />

              <Card>
                <CardHeader>
                  <CardTitle>Stakeholder Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 leading-relaxed">
                    {audit.report.stakeholderSummary}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="findings">
              <FindingsTable findings={audit.findings} />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceTab auditId={audit.id} />
            </TabsContent>

            <TabsContent value="keywords">
              <KeywordsTab auditId={audit.id} />
            </TabsContent>

            <TabsContent value="competitors">
              <CompetitorsTab auditId={audit.id} />
            </TabsContent>

            <TabsContent value="suggestions">
              <SuggestionsTab auditId={audit.id} />
            </TabsContent>

            <TabsContent value="roadmap">
              <Roadmap roadmap={audit.report.roadmap} />
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <ActionItems actionItems={audit.report.actionItems} />

              <Card>
                <CardHeader>
                  <CardTitle>Development Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {audit.report.devTaskList.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{task.task}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Effort: {task.effort}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!isComplete && !isCrawling && !isAnalyzing && !isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Ready to start crawling {audit.domain}</p>
            <Button onClick={startCrawl} size="lg">Start SEO Audit</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
