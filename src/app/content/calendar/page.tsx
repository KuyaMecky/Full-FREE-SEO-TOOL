"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Plus, Calendar, ArrowRight, Globe, Tag } from "lucide-react";

interface Draft {
  id: string; title: string; slug: string; focusKeyword: string;
  status: string; wpPostId: number | null; createdAt: string; updatedAt: string;
  property: { siteUrl: string } | null;
  wpConnection: { label: string } | null;
}

const STATUS_COLS = [
  { key: "draft",     label: "Draft",       color: "border-t-border bg-muted/20" },
  { key: "review",    label: "In Review",   color: "border-t-amber-400 bg-amber-500/5" },
  { key: "ready",     label: "Ready",       color: "border-t-blue-400 bg-blue-500/5" },
  { key: "published", label: "Published",   color: "border-t-emerald-400 bg-emerald-500/5" },
] as const;

type DraftStatus = typeof STATUS_COLS[number]["key"];

export default function ContentCalendarPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/content/drafts")
      .then(r => r.json())
      .then(d => setDrafts(d.drafts ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function moveTo(id: string, status: DraftStatus) {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    await fetch(`/api/content/drafts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const byStatus = (status: string) => drafts.filter(d => {
    if (status === "draft") return d.status === "draft" || !STATUS_COLS.map(c => c.key).includes(d.status as DraftStatus);
    return d.status === status;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Content Calendar" description="Manage your content pipeline from idea to published post." />
        <Link href="/content">
          <button className="flex items-center gap-1.5 h-9 px-4 rounded bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="h-3.5 w-3.5" /> New draft
          </button>
        </Link>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : drafts.length === 0 ? (
        <div className="rounded border-2 border-dashed border-border py-16 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-display font-bold text-lg mb-2">No drafts yet</p>
          <p className="text-[13px] text-muted-foreground mb-6">Generate your first article from the Content Planner.</p>
          <Link href="/content">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded text-[13px] hover:bg-primary/90 transition-colors mx-auto">
              <Plus className="h-4 w-4" /> Create content
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUS_COLS.map(col => (
            <div key={col.key}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) moveTo(dragging, col.key); setDragging(null); }}
              className={`rounded border-t-2 border border-border ${col.color} min-h-[200px]`}>
              <div className="px-3 py-2.5 border-b border-border">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em]">{col.label}</p>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-full">
                    {byStatus(col.key).length}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {byStatus(col.key).map(draft => (
                  <div key={draft.id}
                    draggable
                    onDragStart={() => setDragging(draft.id)}
                    onDragEnd={() => setDragging(null)}
                    className="rounded border border-border bg-background p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all group">
                    <p className="text-[12px] font-semibold leading-snug line-clamp-2 mb-2">{draft.title}</p>
                    <div className="space-y-1">
                      {draft.focusKeyword && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {draft.focusKeyword}
                        </p>
                      )}
                      {draft.property && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                          <Globe className="h-2.5 w-2.5 shrink-0" />
                          {draft.property.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </p>
                      )}
                    </div>
                    <Link href={`/content/drafts/${draft.id}`} onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
