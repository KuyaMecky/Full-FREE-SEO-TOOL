"use client";

import { useEffect, useState, use } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Sparkles,
  Send,
  Save,
  Eye,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Image,
  Link2,
  Code,
  FileText,
} from "lucide-react";

interface WpConnection {
  id: string;
  label: string;
  siteUrl: string;
}

interface Draft {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  content: string;
  schemaMarkup: string | null;
  internalLinks: string;
  imageSuggestions: string;
  status: string;
  wpPostId: number | null;
  property: { siteUrl: string } | null;
  wpConnection: WpConnection | null;
  cluster: { name: string; pillarTopic: string } | null;
}

interface ImageSuggestion {
  placement: string;
  altText: string;
  description: string;
}

interface InternalLink {
  anchor: string;
  targetUrl: string;
}

export default function DraftEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [content, setContent] = useState("");

  // Write article
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState("");

  // Publish
  const [wpConnections, setWpConnections] = useState<WpConnection[]>([]);
  const [selectedWpId, setSelectedWpId] = useState("");
  const [publishStatus, setPublishStatus] = useState<"draft" | "publish">("draft");
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/content/drafts/${id}`).then((r) => r.json()),
      fetch("/api/wordpress/connections").then((r) => r.json()),
    ]).then(([draftData, wpData]) => {
      if (draftData.draft) {
        const d = draftData.draft as Draft;
        setDraft(d);
        setTitle(d.title);
        setSlug(d.slug);
        setMetaTitle(d.metaTitle);
        setMetaDescription(d.metaDescription);
        setFocusKeyword(d.focusKeyword);
        setContent(d.content);
        setSelectedWpId(d.wpConnection?.id ?? "");
      }
      setWpConnections(wpData.connections ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/content/drafts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          metaTitle,
          metaDescription,
          focusKeyword,
          content,
          wpConnectionId: selectedWpId || undefined,
        }),
      });
      if (res.ok) {
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleWrite() {
    setWriting(true);
    setWriteError("");
    try {
      const res = await fetch(`/api/content/drafts/${id}/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outline: [],
          intent: "informational",
          estimatedWordCount: 1200,
          internalLinkTargets: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWriteError(data.error ?? "Write failed");
      } else {
        const d = data.draft;
        setContent(d.content ?? "");
        setMetaTitle(d.metaTitle ?? "");
        setMetaDescription(d.metaDescription ?? "");
        setSlug(d.slug ?? "");
        setDraft((prev) => (prev ? { ...prev, ...d } : prev));
      }
    } finally {
      setWriting(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishMsg("");
    setPublishError("");

    if (selectedWpId && selectedWpId !== draft?.wpConnection?.id) {
      await fetch(`/api/content/drafts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wpConnectionId: selectedWpId }),
      });
    }

    try {
      const res = await fetch(`/api/content/drafts/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error ?? "Publish failed");
      } else {
        const conn = wpConnections.find((c) => c.id === selectedWpId);
        const postUrl = conn
          ? `${conn.siteUrl.replace(/\/$/, "")}/?p=${data.wpPost?.id}`
          : undefined;
        setPublishMsg(
          publishStatus === "publish"
            ? `Published! WP post #${data.wpPost?.id}`
            : `Saved as draft in WordPress (post #${data.wpPost?.id})`
        );
        setDraft((prev) =>
          prev
            ? { ...prev, status: data.draft.status, wpPostId: data.draft.wpPostId }
            : prev
        );
        void postUrl;
      }
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
        <p className="text-muted-foreground text-sm">Loading draft…</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Draft not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const imageSuggestions: ImageSuggestion[] = (() => {
    try { return JSON.parse(draft.imageSuggestions); } catch { return []; }
  })();

  const internalLinks: InternalLink[] = (() => {
    try { return JSON.parse(draft.internalLinks); } catch { return []; }
  })();

  const metaTitleLen = metaTitle.length;
  const metaDescLen = metaDescription.length;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/content/drafts">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Drafts
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {draft.status === "published" ? (
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Published
              </Badge>
            ) : (
              <Badge variant="outline">Draft</Badge>
            )}
            {draft.wpPostId && (
              <Badge variant="outline" className="text-xs">WP #{draft.wpPostId}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {saveMsg}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button size="sm" onClick={handleWrite} disabled={writing}>
            {writing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {writing ? "Writing…" : content ? "Rewrite" : "Generate Article"}
          </Button>
        </div>
      </div>

      {writeError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{writeError}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-6">
          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="schema">
                <Code className="h-4 w-4 mr-2" />
                Schema
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title (H1)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-slug"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="focusKeyword">Focus Keyword</Label>
                  <Input
                    id="focusKeyword"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="target keyword"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle">SEO Title</Label>
                  <span className={`text-xs ${metaTitleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                    {metaTitleLen}/60
                  </span>
                </div>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <span className={`text-xs ${metaDescLen > 158 ? "text-destructive" : metaDescLen < 120 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {metaDescLen}/158
                  </span>
                </div>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Article Content (HTML)</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={24}
                  className="font-mono text-xs"
                  placeholder="Click 'Generate Article' to produce AI-written content, or paste HTML here."
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="py-6">
                  {/* SERP snippet */}
                  <div className="mb-6 p-4 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">SERP Preview</p>
                    <p className="text-[#1a0dab] dark:text-blue-400 text-lg font-medium leading-tight">
                      {metaTitle || title}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      {draft.property?.siteUrl.replace(/^https?:\/\//, "")}/{slug}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 leading-snug">{metaDescription}</p>
                  </div>

                  <Separator className="mb-6" />

                  {content ? (
                    <article
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Generate the article to see a preview.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schema" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Schema Markup</CardTitle>
                  <CardDescription>JSON-LD structured data generated for this article.</CardDescription>
                </CardHeader>
                <CardContent>
                  {draft.schemaMarkup ? (
                    <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-96">
                      {draft.schemaMarkup}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">No schema markup yet. Generate the article first.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4" />
                Publish to WordPress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">WordPress Site</Label>
                {wpConnections.length === 0 ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">No sites connected.</p>
                    <Link href="/settings/integrations/wordpress">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Connect WordPress
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedWpId}
                    onChange={(e) => setSelectedWpId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select a site…</option>
                    {wpConnections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Publish as</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPublishStatus("draft")}
                    className={`flex-1 h-9 rounded-md border text-sm transition-colors ${
                      publishStatus === "draft"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setPublishStatus("publish")}
                    className={`flex-1 h-9 rounded-md border text-sm transition-colors ${
                      publishStatus === "publish"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    Live
                  </button>
                </div>
              </div>

              {publishError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{publishError}</AlertDescription>
                </Alert>
              )}
              {publishMsg && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{publishMsg}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                onClick={handlePublish}
                disabled={publishing || !selectedWpId || !content}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                {publishing
                  ? "Publishing…"
                  : draft.wpPostId
                  ? "Update in WordPress"
                  : publishStatus === "publish"
                  ? "Publish to WordPress"
                  : "Send Draft to WordPress"}
              </Button>
            </CardContent>
          </Card>

          {/* SEO score card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">SEO Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Focus keyword set", pass: !!focusKeyword },
                { label: "SEO title ≤60 chars", pass: metaTitleLen > 0 && metaTitleLen <= 60 },
                { label: "Meta description 120–158", pass: metaDescLen >= 120 && metaDescLen <= 158 },
                { label: "Keyword in SEO title", pass: !!metaTitle && !!focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()) },
                { label: "Content generated", pass: content.length > 500 },
                { label: "Slug set", pass: !!slug },
                { label: "Schema markup present", pass: !!draft.schemaMarkup },
              ].map(({ label, pass }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {pass ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={pass ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Internal links */}
          {internalLinks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Internal Links ({internalLinks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {internalLinks.map((link, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <p className="font-medium text-primary">"{link.anchor}"</p>
                    <p className="text-muted-foreground truncate">{link.targetUrl}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Image suggestions */}
          {imageSuggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image Suggestions ({imageSuggestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {imageSuggestions.map((img, i) => (
                  <div key={i} className="text-xs space-y-1">
                    <p className="font-medium">{img.placement}</p>
                    <p className="text-muted-foreground">{img.description}</p>
                    <p className="text-blue-600 dark:text-blue-400">Alt: {img.altText}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
