"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  AlertCircle,
  ChevronLeft,
  Trash2,
  Gauge,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface Status {
  configured: boolean;
  source: "db" | "env" | null;
  keyPreview: string | null;
}

export default function PagespeedSettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch("/api/settings/pagespeed");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "API key is required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/pagespeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setApiKey("");
        setMessage({
          type: "success",
          text: "Saved. You now have 25,000 PageSpeed queries/day.",
        });
      } else {
        setMessage({ type: "error", text: data.error || "Save failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!confirm("Clear saved PageSpeed API key?")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/pagespeed", { method: "DELETE" });
      const data = await res.json();
      setStatus(data);
      setMessage({ type: "success", text: "API key cleared." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>
      <PageHeader
        icon={Gauge}
        title="PageSpeed Insights"
        accent="amber"
        description="Add a free Google API key for 25,000 PageSpeed queries/day. Without it, you share a tight anonymous rate limit."
      />
      <HelpBanner guideKey="settingsPagespeed" guide={GUIDES.settingsPagespeed} />

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className="mb-6"
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {status?.configured && (
        <Card className="mb-6 border-emerald-500/30 bg-emerald-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Connected
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                source: {status.source}
              </Badge>
            </CardTitle>
            <CardDescription>
              Key{" "}
              <code className="font-mono text-xs">{status.keyPreview}</code>{" "}
              is in use. Performance tools route through your quota.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/performance">
              <Button className="gap-2">Try the Performance tool</Button>
            </Link>
            {status.source === "db" && (
              <Button
                variant="outline"
                onClick={clear}
                disabled={saving}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1 — Get a free API key</CardTitle>
          <CardDescription>
            Google hands these out for free with a 25,000 queries/day quota.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal pl-5 space-y-3 text-sm text-foreground/80">
            <li>
              Open{" "}
              <a
                href="https://developers.google.com/speed/docs/insights/v5/get-started"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                the PageSpeed Insights getting-started page
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </li>
            <li>
              Click the blue <strong>Get a Key</strong> button. Sign in with
              your Google account if prompted.
            </li>
            <li>
              Pick (or create) a Google Cloud project, accept the terms, and
              Google will show your new API key.
            </li>
            <li>Copy the key — it starts with <code className="font-mono text-xs">AIza…</code></li>
          </ol>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No credit card needed. The key is bound to the PageSpeed Insights
              API only — it can&apos;t be used for billable services.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Paste the key here</CardTitle>
          <CardDescription>
            Stored in the local SQLite database. Only sent to Google during a
            PageSpeed request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                status?.configured
                  ? "Leave blank to keep the saved key"
                  : "AIzaSy…"
              }
              className="mt-1 font-mono text-sm"
            />
          </div>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving
              ? "Saving…"
              : status?.configured
                ? "Update key"
                : "Save API key"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
