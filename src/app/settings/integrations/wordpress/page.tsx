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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
  Settings,
} from "lucide-react";

interface WpConnection {
  id: string;
  label: string;
  siteUrl: string;
  username: string;
  createdAt: string;
}

export default function WordPressSettingsPage() {
  const [connections, setConnections] = useState<WpConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState("My WordPress Site");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string }>>({});

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    setLoading(true);
    try {
      const res = await fetch("/api/wordpress/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    setAddSuccess("");
    try {
      const res = await fetch("/api/wordpress/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, siteUrl, username, appPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add connection");
      } else {
        setAddSuccess(`Connected as "${data.displayName ?? username}" on ${siteUrl}`);
        setLabel("My WordPress Site");
        setSiteUrl("");
        setUsername("");
        setAppPassword("");
        fetchConnections();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this WordPress connection?")) return;
    await fetch(`/api/wordpress/connections/${id}`, { method: "DELETE" });
    setConnections((c) => c.filter((x) => x.id !== id));
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/wordpress/connections/${id}`, { method: "POST" });
      const data = await res.json();
      setTestResults((r) => ({ ...r, [id]: data }));
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Settings
          </Button>
        </Link>
      </div>

      <PageHeader
        icon={Globe}
        title="WordPress Integration"
        description="Connect your WordPress sites to publish AI-generated content directly as drafts or live posts."
      />

      {/* Add connection form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add WordPress Site</CardTitle>
          <CardDescription>
            Use an{" "}
            <a
              href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              Application Password
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            — never your main account password. Found in WordPress Admin → Users → Profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="My WordPress Site"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="username">WordPress Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="appPassword">Application Password</Label>
                  <Input
                    id="appPassword"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    type="password"
                    required
                  />
                </div>
              </div>
            </div>

            {addError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
            {addSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{addSuccess}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={adding} className="w-full">
              {adding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {adding ? "Testing & Saving…" : "Connect Site"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : connections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sites connected yet.</p>
          ) : (
            <div className="space-y-3">
              {connections.map((conn, i) => {
                const test = testResults[conn.id];
                return (
                  <div key={conn.id}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">{conn.label}</span>
                          {test && (
                            <Badge
                              variant={test.ok ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {test.ok ? "Connected" : "Failed"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-6">{conn.siteUrl}</p>
                        <p className="text-xs text-muted-foreground ml-6">User: {conn.username}</p>
                        {test && !test.ok && (
                          <p className="text-xs text-destructive ml-6 mt-1">{test.error}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(conn.id)}
                          disabled={testingId === conn.id}
                        >
                          {testingId === conn.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(conn.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
