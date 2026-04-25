"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SerpPreview } from "@/components/serp-preview";

export default function SerpPreviewPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="SERP Snippet Preview" description="See exactly how your page title and meta description appear in Google search results." />

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Page URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/page"
              className="w-full h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">SEO Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Best SEO Audit Tool · Free Forever"
              className="w-full h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Meta Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Describe your page in 120–158 characters. Include the focus keyword naturally near the beginning."
              className="w-full rounded border border-border bg-background px-3 py-2.5 text-[13px] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
          </div>
        </div>

        <div className="space-y-4">
          <SerpPreview title={title} description={description} url={url} />

          <div className="rounded border border-border bg-card p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Best practices</p>
            {[
              { rule: "Title 50–60 characters", pass: title.length >= 50 && title.length <= 60 },
              { rule: "Meta desc 120–158 characters", pass: description.length >= 120 && description.length <= 158 },
              { rule: "URL provided", pass: !!url },
              { rule: "Title not truncated (≤60)", pass: title.length <= 60 },
              { rule: "Description not truncated (≤158)", pass: description.length <= 158 },
            ].map(({ rule, pass }) => (
              <div key={rule} className="flex items-center gap-2 text-[12px]">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${pass ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                <span className={pass ? "text-foreground" : "text-muted-foreground"}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
