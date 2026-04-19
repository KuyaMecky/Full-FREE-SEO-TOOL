"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Smartphone,
  Sparkles,
  ExternalLink,
  FileDown,
  Plus,
  Trash2,
  Clock,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface Property {
  id: string;
  siteUrl: string;
}

interface InspectionResult {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      robotsTxtState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      sitemap?: string[];
      referringUrls?: string[];
      crawledAs?: string;
    };
    mobileUsabilityResult?: {
      verdict?: string;
      issues?: Array<{ issueType?: string; severity?: string; message?: string }>;
    };
    richResultsResult?: {
      verdict?: string;
      detectedItems?: Array<{
        richResultType?: string;
        items?: Array<{
          name?: string;
          issues?: Array<{ issueMessage?: string; severity?: string }>;
        }>;
      }>;
    };
  };
}

interface IndexedPage {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  indexed: boolean;
}

interface Submission {
  id: string;
  url: string;
  status: string;
  note: string;
  lastIndexVerdict?: string | null;
  lastCoverageState?: string | null;
  lastFetchState?: string | null;
  lastCrawlTime?: string | null;
  lastCheckedAt?: string | null;
  submittedAt: string;
}

function verdictBadge(verdict?: string | null) {
  const v = (verdict || "").toUpperCase();
  if (v === "PASS") {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
        Pass
      </Badge>
    );
  }
  if (v === "PARTIAL") {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
        Partial
      </Badge>
    );
  }
  if (v === "FAIL") {
    return (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30">
        Fail
      </Badge>
    );
  }
  if (verdict) return <Badge variant="outline">{verdict}</Badge>;
  return null;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-muted text-muted-foreground border-border",
    },
    requested: {
      label: "Requested",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    },
    indexed: {
      label: "Indexed",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    not_indexed: {
      label: "Not indexed",
      className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    },
    error: {
      label: "Error",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    },
  };
  const { label, className } = map[status] ?? {
    label: status,
    className: "",
  };
  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
}

function gscInspectUrl(siteUrl: string, url: string): string {
  return `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(siteUrl)}&url=${encodeURIComponent(url)}`;
}

export default function IndexingPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [propsLoading, setPropsLoading] = useState(true);

  if (propsLoading) {
    // fall through to effect below
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gsc/properties");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties);
          if (data.properties.length > 0) setPropertyId(data.properties[0].id);
        }
      } finally {
        setPropsLoading(false);
      }
    })();
  }, []);

  const currentProperty = properties.find((p) => p.id === propertyId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={Search}
        title="Indexing"
        accent="blue"
        description="See which pages are indexed, inspect any URL, request indexing, and track submissions over time."
      />
      <HelpBanner guideKey="indexing" guide={GUIDES.indexing} />

      {propsLoading ? null : properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Connect a Search Console property first to unlock indexing tools.
            </p>
            <Link href="/properties">
              <Button>Go to Properties</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.siteUrl}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Tabs defaultValue="inspect">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="inspect">Inspect URL</TabsTrigger>
              <TabsTrigger value="pages">Indexed Pages</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="inspect" className="mt-6">
              {currentProperty && (
                <InspectTab property={currentProperty} />
              )}
            </TabsContent>
            <TabsContent value="pages" className="mt-6">
              {currentProperty && (
                <IndexedPagesTab property={currentProperty} />
              )}
            </TabsContent>
            <TabsContent value="submissions" className="mt-6">
              {currentProperty && (
                <SubmissionsTab property={currentProperty} />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// ───────── Inspect URL Tab ─────────

function InspectTab({ property }: { property: Property }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!url.trim()) {
      setError("Enter a URL");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id, url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.result);
      else setError(data.error || "Failed");
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const indexStatus = result?.inspectionResult?.indexStatusResult;
  const mobile = result?.inspectionResult?.mobileUsabilityResult;
  const rich = result?.inspectionResult?.richResultsResult;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspect a URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/some-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  run();
                }
              }}
              className="mt-1"
            />
          </div>
          <Button onClick={run} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Inspecting…" : "Inspect"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {result.inspectionResult?.inspectionResultLink && (
            <a
              href={result.inspectionResult.inspectionResultLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Open in Search Console
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Indexing status
                {verdictBadge(indexStatus?.verdict)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <StatusRow label="Coverage" value={indexStatus?.coverageState} />
                <StatusRow label="Indexing" value={indexStatus?.indexingState} />
                <StatusRow label="Robots.txt" value={indexStatus?.robotsTxtState} />
                <StatusRow label="Fetch" value={indexStatus?.pageFetchState} />
                <StatusRow label="Crawled as" value={indexStatus?.crawledAs} />
                <StatusRow
                  label="Last crawl"
                  value={
                    indexStatus?.lastCrawlTime
                      ? new Date(indexStatus.lastCrawlTime).toLocaleString()
                      : undefined
                  }
                />
                <StatusRow label="Google canonical" value={indexStatus?.googleCanonical} mono />
                <StatusRow label="User canonical" value={indexStatus?.userCanonical} mono />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile usability
                {verdictBadge(mobile?.verdict)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!mobile?.issues || mobile.issues.length === 0 ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  No mobile usability issues detected.
                </p>
              ) : (
                <ul className="space-y-2">
                  {mobile.issues.map((issue, i) => (
                    <li key={i} className="text-sm border-l-2 border-rose-500/60 pl-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {issue.severity}
                        </Badge>
                        <span className="font-medium">{issue.issueType}</span>
                      </div>
                      {issue.message && (
                        <div className="text-muted-foreground mt-0.5">{issue.message}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Rich results
                {verdictBadge(rich?.verdict)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!rich?.detectedItems || rich.detectedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No structured data detected on this URL.
                </p>
              ) : (
                <ul className="space-y-3">
                  {rich.detectedItems.map((item, i) => (
                    <li key={i}>
                      <div className="font-medium text-sm">{item.richResultType}</div>
                      {item.items && item.items.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {item.items.map((sub, j) => (
                            <li key={j} className="text-sm text-muted-foreground ml-4">
                              {sub.name || "(unnamed item)"}
                              {sub.issues && sub.issues.length > 0 && (
                                <ul className="mt-1 space-y-0.5 ml-4">
                                  {sub.issues.map((iss, k) => (
                                    <li key={k} className="text-xs flex items-center gap-1.5">
                                      <X className="h-3 w-3 text-rose-500" />
                                      {iss.issueMessage}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ───────── Indexed Pages Tab ─────────

function IndexedPagesTab({ property }: { property: Property }) {
  const [pages, setPages] = useState<IndexedPage[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tools/indexing/pages?propertyId=${property.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setPages(data.pages);
          setFetchedAt(data.fetchedAt);
          setNote(data.note ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [property.id]);

  const filtered = useMemo(() => {
    if (!filter) return pages;
    return pages.filter((p) =>
      p.page.toLowerCase().includes(filter.toLowerCase())
    );
  }, [pages, filter]);

  const indexedCount = pages.filter((p) => p.indexed).length;

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This list is derived from Google Search Console&apos;s page
          performance data. Pages with impressions in the last 28 days were
          shown to users in Google — i.e. indexed. Pages without impressions
          may still be indexed but haven&apos;t ranked yet; use{" "}
          <strong>Inspect URL</strong> for an authoritative check.
        </AlertDescription>
      </Alert>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading pages…
          </CardContent>
        </Card>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {note || "No pages with data yet."}
            </p>
            <Link href={`/properties/${property.id}`}>
              <Button size="sm" variant="outline">
                Open property & refresh
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {indexedCount} indexed pages
            </CardTitle>
            <CardDescription>
              {fetchedAt
                ? `GSC data as of ${new Date(fetchedAt).toLocaleString()}`
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-3">
              <Input
                placeholder="Filter URL…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Impr.</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 500).map((p) => (
                    <TableRow key={p.page}>
                      <TableCell className="max-w-md truncate font-medium">
                        {p.page}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.impressions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.position.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={gscInspectUrl(property.siteUrl, p.page)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          GSC
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 500 && (
              <div className="p-4 text-sm text-muted-foreground">
                Showing first 500 of {filtered.length}.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ───────── Submissions Tab ─────────

function SubmissionsTab({ property }: { property: Property }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await fetch(
        `/api/tools/indexing/submissions?propertyId=${property.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [property.id]);

  const add = async () => {
    const u = url.trim();
    if (!u) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/tools/indexing/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id, url: u, note }),
      });
      const data = await res.json();
      if (res.ok) {
        setUrl("");
        setNote("");
        await load();
      } else setError(data.error || "Failed");
    } catch {
      setError("Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const recheck = async (id: string) => {
    setRecheckingId(id);
    try {
      await fetch(`/api/tools/indexing/submissions/${id}/recheck`, {
        method: "POST",
      });
      await load();
    } finally {
      setRecheckingId(null);
    }
  };

  const markRequested = async (id: string) => {
    await fetch(`/api/tools/indexing/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "requested" }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    await fetch(`/api/tools/indexing/submissions/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a URL to track</CardTitle>
          <CardDescription>
            Save URLs you want indexed. Use the <strong>Open in GSC</strong>{" "}
            button to request indexing, mark as <em>Requested</em>, then
            re-check on a schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="new-url">URL</Label>
            <Input
              id="new-url"
              placeholder="https://example.com/new-post"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-note">Note (optional)</Label>
            <Input
              id="new-note"
              placeholder="e.g. blog post about X"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={add} disabled={adding} className="gap-2">
            <Plus className="h-4 w-4" />
            {adding ? "Adding…" : "Add"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>About requesting indexing:</strong> Google&apos;s Indexing API
          only supports <code>JobPosting</code> and <code>BroadcastEvent</code>{" "}
          page types. For everything else, the supported path is clicking
          &quot;Request Indexing&quot; inside the Search Console UI — which the{" "}
          <strong>Open in GSC</strong> button opens directly. After submitting
          there, mark the row as <em>Requested</em> and re-check back here to
          watch the status change.
        </AlertDescription>
      </Alert>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading submissions…
          </CardContent>
        </Card>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No tracked URLs yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(s.status)}
                      {verdictBadge(s.lastIndexVerdict)}
                    </div>
                    <div className="font-medium mt-1 break-all">{s.url}</div>
                    {s.note && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.note}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Added {new Date(s.submittedAt).toLocaleDateString()}
                      </span>
                      {s.lastCheckedAt && (
                        <span>
                          Checked {new Date(s.lastCheckedAt).toLocaleString()}
                        </span>
                      )}
                      {s.lastCoverageState && (
                        <span>· {s.lastCoverageState}</span>
                      )}
                      {s.lastCrawlTime && (
                        <span>
                          · Crawled {new Date(s.lastCrawlTime).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={gscInspectUrl(property.siteUrl, s.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      <Send className="h-3.5 w-3.5" />
                      Open in GSC
                    </Button>
                  </a>
                  {s.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markRequested(s.id)}
                    >
                      Mark as requested
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recheck(s.id)}
                    disabled={recheckingId === s.id}
                    className="gap-2"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${recheckingId === s.id ? "animate-spin" : ""}`}
                    />
                    {recheckingId === s.id ? "Checking…" : "Re-check"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(s.id)}
                    className="gap-2 text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────── Shared ─────────

function StatusRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-sm ${mono ? "font-mono break-all" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}
