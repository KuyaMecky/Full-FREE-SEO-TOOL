"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  FileText,
  Plus,
  ArrowRight,
  Globe,
  Tag,
  Clock,
  CheckCircle,
  Send,
  PenLine,
} from "lucide-react";

interface DraftItem {
  id: string;
  title: string;
  slug: string;
  focusKeyword: string;
  status: string;
  wpPostId: number | null;
  createdAt: string;
  updatedAt: string;
  property: { siteUrl: string } | null;
  wpConnection: { label: string; siteUrl: string } | null;
  cluster: { name: string } | null;
}

function statusBadge(status: string) {
  if (status === "published")
    return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">Published</Badge>;
  if (status === "draft")
    return <Badge variant="outline">Draft</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content/drafts")
      .then((r) => r.json())
      .then((d) => setDrafts(d.drafts ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={PenLine}
          title="Content Drafts"
          description="AI-generated articles ready to review, edit, and publish to WordPress."
        />
        <Link href="/content">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Draft
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading drafts…</p>
      ) : drafts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No drafts yet.</p>
            <Link href="/content">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Generate your first article
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(draft.status)}
                      {draft.wpPostId && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          WP #{draft.wpPostId}
                        </Badge>
                      )}
                      {draft.cluster && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />
                          {draft.cluster.name}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium leading-snug">{draft.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {draft.focusKeyword && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {draft.focusKeyword}
                        </span>
                      )}
                      {draft.property && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {draft.property.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </span>
                      )}
                      {draft.wpConnection && (
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          {draft.wpConnection.label}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link href={`/content/drafts/${draft.id}`}>
                    <Button variant="outline" size="sm">
                      Open
                      <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
