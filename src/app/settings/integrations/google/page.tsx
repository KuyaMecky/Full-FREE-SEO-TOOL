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
  Copy,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  Trash2,
} from "lucide-react";

interface Status {
  configured: boolean;
  source: "db" | "env" | "mixed" | null;
  redirectUri: string;
  clientIdPreview: string | null;
}

export default function GoogleIntegrationSettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch("/api/settings/google");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setMessage({
        type: "error",
        text: "Client ID and Client Secret are required.",
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setClientId("");
        setClientSecret("");
        setMessage({
          type: "success",
          text: "Saved. You can now connect Google Search Console.",
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
    if (!confirm("Clear saved Google OAuth credentials?")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/google", { method: "DELETE" });
      const data = await res.json();
      setStatus(data);
      setMessage({ type: "success", text: "Credentials cleared." });
    } finally {
      setSaving(false);
    }
  };

  const copyRedirect = async () => {
    if (!status) return;
    await navigator.clipboard.writeText(status.redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>
      <h1 className="text-3xl font-bold mb-2">Google Search Console</h1>
      <p className="text-gray-600 mb-6">
        Connect the app to the Google Search Console API so you (and anyone using
        this install) can pull impressions, clicks, keyword rankings, and page
        metrics.
      </p>

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
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Check className="h-5 w-5 text-green-600" />
              Connected
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                source: {status.source}
              </Badge>
            </CardTitle>
            <CardDescription>
              Client ID{" "}
              <code className="font-mono text-xs">
                {status.clientIdPreview}
              </code>{" "}
              is configured. The Connect Google button should work.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/properties">
              <Button className="gap-2">
                Go to Properties
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={clear}
              disabled={saving}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1 — Create an OAuth client</CardTitle>
          <CardDescription>
            One-time setup in Google Cloud Console. Takes ~5 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-700">
            <li>
              Open{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Google Cloud Console
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and create (or select) a project. Sign in with the Google account
              that owns your verified Search Console property.
            </li>
            <li>
              In the top search bar, type{" "}
              <strong>Search Console API</strong> → open it → click{" "}
              <strong>Enable</strong>.
            </li>
            <li>
              Left sidebar → <strong>APIs &amp; Services → OAuth consent screen</strong>.
              Choose <strong>External</strong>, fill in the app name and your
              email, then add yourself under <strong>Test users</strong>.
            </li>
            <li>
              Left sidebar → <strong>APIs &amp; Services → Credentials</strong> →{" "}
              <strong>+ Create Credentials</strong> →{" "}
              <strong>OAuth client ID</strong>.
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                <li>
                  Application type: <strong>Web application</strong>
                </li>
                <li>Name: anything, e.g. <code>seo-audit-app-local</code></li>
                <li>
                  <strong>Authorized redirect URIs</strong>: add the URI below
                  exactly.
                </li>
              </ul>
            </li>
          </ol>

          <div className="mt-4">
            <Label>Authorized redirect URI (paste this into Google)</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono break-all">
                {status?.redirectUri}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyRedirect}
                className="gap-2 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Paste the credentials here</CardTitle>
          <CardDescription>
            After creating the OAuth client, Google shows a Client ID and Client
            Secret. Paste them below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="123456789012-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="client-secret">Client Secret</Label>
            <Input
              id="client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-…"
              className="mt-1 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Stored in the local SQLite database. Not sent anywhere except to
              Google during the OAuth handshake.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? "Saving…" : "Save credentials"}
            </Button>
            {status?.configured && (
              <Link href="/properties">
                <Button variant="outline">Skip to Connect</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
