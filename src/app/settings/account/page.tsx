"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ChevronLeft, Loader2, CheckCircle, AlertCircle, Bell, Key } from "lucide-react";

interface UserSettings {
  aiProvider: string | null; aiApiKey: string | null; aiModel: string | null;
  emailAlerts: boolean; alertEmail: string | null; rankDropThreshold: number;
}

const AI_PROVIDERS = [
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "openai", label: "OpenAI GPT" },
  { value: "gemini", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
];

export default function AccountSettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    aiProvider: "", aiApiKey: "", aiModel: "", emailAlerts: false, alertEmail: "", rankDropThreshold: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/settings/user").then(r => r.json()).then(d => {
      if (d.settings) setSettings({ ...settings, ...d.settings });
    }).finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(""); setErr("");
    const res = await fetch("/api/settings/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (res.ok) setMsg("Settings saved");
    else setErr(data.error ?? "Failed to save");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10"><p className="text-[13px] text-muted-foreground">Loading…</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <button className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Settings
          </button>
        </Link>
      </div>

      <PageHeader title="Account Settings" description="Personal API keys and notification preferences. These override the global settings for your account only." />

      <form onSubmit={save} className="space-y-8">
        {/* Per-user AI keys */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Key className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-[14px]">Your AI API key</p>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-[12px] text-muted-foreground mb-4">Override the shared AI key with your own. AI calls will be billed to your account instead of the app owner.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Provider</label>
              <select value={settings.aiProvider ?? ""} onChange={e => setSettings(s => ({ ...s, aiProvider: e.target.value || null }))}
                className="w-full h-10 rounded border border-border bg-background px-3 text-[13px]">
                <option value="">Use global setting</option>
                {AI_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {settings.aiProvider && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">API Key</label>
                  <input type="password" value={settings.aiApiKey ?? ""} onChange={e => setSettings(s => ({ ...s, aiApiKey: e.target.value }))}
                    placeholder="Your personal API key"
                    className="w-full h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Model override (optional)</label>
                  <input value={settings.aiModel ?? ""} onChange={e => setSettings(s => ({ ...s, aiModel: e.target.value }))}
                    placeholder="e.g. claude-sonnet-4-6"
                    className="w-full h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Email alerts */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-[14px]">Email alerts</p>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-[12px] text-muted-foreground mb-4">
            Get notified when tasks are assigned to you or when a tracked keyword drops significantly.
            Requires <code className="bg-muted px-1 rounded text-[11px]">SMTP_HOST</code> environment variables to be configured.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={settings.emailAlerts}
                  onChange={e => setSettings(s => ({ ...s, emailAlerts: e.target.checked }))} />
                <div className={`w-9 h-5 rounded-full transition-colors ${settings.emailAlerts ? "bg-primary" : "bg-muted border border-border"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.emailAlerts ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </div>
              <span className="text-[13px] font-medium">Enable email alerts</span>
            </label>

            {settings.emailAlerts && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Alert email</label>
                  <input type="email" value={settings.alertEmail ?? ""} onChange={e => setSettings(s => ({ ...s, alertEmail: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Rank drop threshold (positions)</label>
                  <input type="number" min={1} max={50} value={settings.rankDropThreshold}
                    onChange={e => setSettings(s => ({ ...s, rankDropThreshold: Number(e.target.value) }))}
                    className="w-32 h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
                  <p className="text-[11px] text-muted-foreground">Alert when a keyword drops more than this many positions</p>
                </div>
              </>
            )}
          </div>
        </section>

        {err && (
          <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {err}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="h-10 px-6 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save settings"}
          </button>
          {msg && (
            <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" /> {msg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
