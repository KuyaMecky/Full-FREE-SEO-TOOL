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
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface Status {
  configured: boolean;
  source?: "db" | "env" | null;
  keyPreview?: string | null;
}

export default function AhrefsSettingsPage() {
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
      const res = await fetch("/api/settings/ahrefs");
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
      const res = await fetch("/api/settings/ahrefs", {
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
          text: "Saved! You can now run Ahrefs-powered audits.",
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
    if (!confirm("Clear saved Ahrefs API key?")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/ahrefs", { method: "DELETE" });
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
        icon={LinkIcon}
        title="Ahrefs API"
        accent="blue"
        description="Add your Ahrefs API key to unlock domain authority, backlink, and traffic analysis in audits."
      />

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
            </CardTitle>
            <CardDescription>
              Your Ahrefs API key is configured. You can now use Ahrefs-powered audits to analyze domain authority, backlinks, and organic traffic.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/audit-google">
              <Button className="gap-2">Run an Ahrefs Audit</Button>
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
          <CardTitle>Step 1 — Get your Ahrefs API key</CardTitle>
          <CardDescription>
            You need an active Ahrefs subscription to access the API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal pl-5 space-y-3 text-sm text-foreground/80">
            <li>
              Log in to your{" "}
              <a
                href="https://app.ahrefs.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Ahrefs account
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </li>
            <li>
              Go to <strong>Settings → API</strong> from the sidebar or account menu.
            </li>
            <li>
              Create a new API token or use your existing one. Make sure it has access to site overview and backlink data.
            </li>
            <li>
              Copy your API key — it should be a long alphanumeric string starting with <code className="font-mono text-xs">ca_…</code> or similar.
            </li>
          </ol>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ahrefs is a paid service. You need an active subscription to use the API. Pricing starts at $99/month.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Paste your API key here</CardTitle>
          <CardDescription>
            Stored securely in your database. Only sent to Ahrefs API during audit requests.
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
                  : "ca_…"
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
