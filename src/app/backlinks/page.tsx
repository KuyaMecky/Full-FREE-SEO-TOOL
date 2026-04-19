"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Link2,
  Upload,
  FileText,
  ArrowUp,
  ArrowDown,
  Search,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface GscProperty {
  id: string;
  siteUrl: string;
}

function gscLinksUrl(siteUrl: string): string {
  // Search Console's Links report accepts the resource_id as the property
  // identifier — either the domain-property ("sc-domain:example.com") or the
  // URL-prefix form ("https://example.com/"). Either works.
  return `https://search.google.com/search-console/links?resource_id=${encodeURIComponent(siteUrl)}`;
}

function shortSite(siteUrl: string): string {
  return siteUrl
    .replace(/^sc-domain:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

interface Row {
  key: string;
  count: number;
}

type SortDir = "asc" | "desc";
type TabValue = "domains" | "pages" | "anchors";

// Parse a CSV (basic RFC-4180-ish). Returns array of rows of strings.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (field !== "" || cur.length > 0) {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      }
      // Skip \r\n
      if (ch === "\r" && text[i + 1] === "\n") i++;
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== "" || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

function toDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function classifyFile(headers: string[], rows: string[][]): TabValue {
  // GSC Top linking sites → header "Top linking sites", rows are domains
  // GSC Top linking pages → header "Top linking pages", rows are full URLs
  // GSC Top linking text → header "Linking text" + "Sites"
  const h = headers.map((x) => x.toLowerCase());
  const firstHeader = h[0] || "";
  if (firstHeader.includes("text") || firstHeader.includes("anchor")) {
    return "anchors";
  }
  // Sniff first data row
  const first = rows[0]?.[0] || "";
  if (first.startsWith("http")) return "pages";
  if (first.includes(".")) return "domains";
  return "domains";
}

export default function BacklinksPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [properties, setProperties] = useState<GscProperty[]>([]);
  const [domains, setDomains] = useState<Row[]>([]);
  const [pages, setPages] = useState<Row[]>([]);
  const [anchors, setAnchors] = useState<Row[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [tab, setTab] = useState<TabValue>("domains");
  const [filter, setFilter] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gsc/properties");
        if (res.ok) {
          const data = await res.json();
          setProperties(
            (data.properties ?? []).map(
              (p: { id: string; siteUrl: string }) => ({
                id: p.id,
                siteUrl: p.siteUrl,
              })
            )
          );
        }
      } catch {
        // ignore — GSC just won't be connected
      }
    })();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    for (const f of Array.from(files)) {
      try {
        const text = await f.text();
        const rows = parseCsv(text).filter((r) => r.some((c) => c.trim()));
        if (rows.length < 2) continue;
        const headers = rows[0];
        const data = rows.slice(1);
        const kind = classifyFile(headers, data);

        // Column assumptions:
        // GSC "Top linking sites": [Top linking sites, Incoming links, Linked pages]
        // GSC "Top linking pages": [Top linking pages, ...] — usually a URL in col 0
        // GSC "Top linking text": [Linking text, Sites, Target pages]
        const results = new Map<string, number>();
        for (const row of data) {
          const keyRaw = (row[0] || "").trim();
          if (!keyRaw) continue;
          const key = kind === "domains" ? toDomain(keyRaw) : keyRaw;
          const countCol = row[1];
          const parsed = countCol
            ? parseInt(countCol.replace(/[,\s]/g, ""), 10)
            : 1;
          const n = isNaN(parsed) ? 1 : parsed;
          results.set(key, (results.get(key) ?? 0) + n);
        }
        const arr = Array.from(results.entries()).map(([key, count]) => ({
          key,
          count,
        }));

        if (kind === "domains") {
          setDomains((prev) => mergeRows(prev, arr));
        } else if (kind === "pages") {
          setPages((prev) => mergeRows(prev, arr));
        } else {
          setAnchors((prev) => mergeRows(prev, arr));
        }
        setUploadedFiles((prev) => [...prev, `${f.name} → ${kind}`]);
      } catch (err) {
        setError(
          `Failed to parse ${f.name}: ${
            err instanceof Error ? err.message : "unknown error"
          }`
        );
      }
    }
    // Reset the input so the same file can be uploaded again
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    setDomains([]);
    setPages([]);
    setAnchors([]);
    setUploadedFiles([]);
    setError("");
  };

  const active =
    tab === "domains" ? domains : tab === "pages" ? pages : anchors;

  const sortedFiltered = useMemo(() => {
    const filtered = filter
      ? active.filter((r) => r.key.toLowerCase().includes(filter.toLowerCase()))
      : active;
    const copy = [...filtered];
    copy.sort((a, b) => (sortDir === "asc" ? a.count - b.count : b.count - a.count));
    return copy;
  }, [active, filter, sortDir]);

  const totalLinks = active.reduce((s, r) => s + r.count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={Link2}
        title="Backlinks"
        accent="emerald"
        description="Upload your Google Search Console Links report CSVs to analyze your backlink profile. Data stays in your browser — nothing uploaded to any server."
      />
      <HelpBanner guideKey="backlinks" guide={GUIDES.backlinks} />

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Why CSV?</strong> Google Search Console&apos;s backlinks report
          has no public API — data only comes out via CSV export. Below,
          click any connected property to jump straight to its Links page,
          then <strong>Export External links</strong> → drop the 3 CSVs back here.
        </AlertDescription>
      </Alert>

      {properties.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Export from Search Console
            </CardTitle>
            <CardDescription>
              One click opens the Links report for that property in a new tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {properties.map((p) => (
                <a
                  key={p.id}
                  href={gscLinksUrl(p.siteUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {shortSite(p.siteUrl)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.siteUrl.startsWith("sc-domain:")
                        ? "Domain property"
                        : "URL prefix"}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Once you&apos;re on the Links page in Search Console, click{" "}
              <strong>Export External links</strong> in the top-right and
              choose CSV. You&apos;ll get three files covering top linking
              sites, pages, and anchor text. Upload them below.
            </p>
          </CardContent>
        </Card>
      )}

      {properties.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect a Google Search Console property under{" "}
            <a
              href="/properties"
              className="text-primary hover:underline"
            >
              Properties
            </a>{" "}
            to get one-click links to the GSC export page for each of your
            sites. You can still upload CSVs manually below without connecting.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CSVs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-center border-2 border-dashed border-border rounded-md p-8 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <div className="text-sm font-medium">
                Click to select CSV files
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Multiple files supported
              </div>
            </div>
          </label>

          {uploadedFiles.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex flex-wrap gap-1.5">
                {uploadedFiles.map((f, i) => (
                  <Badge key={i} variant="secondary" className="font-normal">
                    {f}
                  </Badge>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear all
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {domains.length === 0 && pages.length === 0 && anchors.length === 0 ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis</CardTitle>
            <CardDescription>
              {totalLinks.toLocaleString()} link references across{" "}
              {active.length} unique {tab === "domains" ? "domains" : tab === "pages" ? "pages" : "anchors"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <TabsList>
                <TabsTrigger value="domains">
                  Domains ({domains.length})
                </TabsTrigger>
                <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
                <TabsTrigger value="anchors">
                  Anchors ({anchors.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="mt-4 space-y-3">
                <div className="relative max-w-sm">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Filter ${tab}…`}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {tab === "domains"
                            ? "Domain"
                            : tab === "pages"
                              ? "Page URL"
                              : "Anchor text"}
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer select-none"
                          onClick={() =>
                            setSortDir(sortDir === "asc" ? "desc" : "asc")
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            Incoming links
                            {sortDir === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedFiltered.slice(0, 500).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="max-w-md truncate font-medium">
                            {r.key}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {sortedFiltered.length > 500 && (
                  <div className="text-sm text-muted-foreground">
                    Showing first 500 of {sortedFiltered.length}.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function mergeRows(existing: Row[], incoming: Row[]): Row[] {
  const map = new Map<string, number>();
  for (const r of existing) map.set(r.key, r.count);
  for (const r of incoming) {
    map.set(r.key, (map.get(r.key) ?? 0) + r.count);
  }
  return Array.from(map.entries()).map(([key, count]) => ({ key, count }));
}
