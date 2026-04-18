"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Check,
  AlertCircle,
  ChevronLeft,
  Trash2,
  Sparkles,
  ExternalLink,
  LogIn,
} from "lucide-react";

type AIProvider = "anthropic" | "openai" | "gemini" | "openrouter";

interface Status {
  provider: AIProvider;
  configuredProviders: AIProvider[];
  model: string;
  modelOverride: boolean;
  keyPreview: string | null;
  source: "db" | "env" | null;
  configured: boolean;
  savedKeys: Record<AIProvider, boolean>;
  envKeysDetected: Record<AIProvider, boolean>;
  defaultModels: Record<AIProvider, string>;
}

const PROVIDER_INFO: Record<
  AIProvider,
  { label: string; consoleUrl: string; consoleLabel: string; keyHint: string; note?: string }
> = {
  anthropic: {
    label: "Anthropic Claude",
    consoleUrl: "https://console.anthropic.com/",
    consoleLabel: "console.anthropic.com",
    keyHint: "sk-ant-…",
  },
  openai: {
    label: "OpenAI",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleLabel: "platform.openai.com/api-keys",
    keyHint: "sk-…",
    note: "OpenAI keys start with sk-proj- or sk-. If yours starts with sk-or-v1-, use the OpenRouter provider instead.",
  },
  gemini: {
    label: "Google Gemini",
    consoleUrl: "https://aistudio.google.com/app/apikey",
    consoleLabel: "aistudio.google.com/app/apikey",
    keyHint: "AIza…",
  },
  openrouter: {
    label: "OpenRouter",
    consoleUrl: "https://openrouter.ai/keys",
    consoleLabel: "openrouter.ai/keys",
    keyHint: "sk-or-v1-…",
    note: "OpenRouter gives access to many models (Anthropic, OpenAI, Gemini, Llama, …) through one key. Set the model in the format vendor/model, e.g. anthropic/claude-sonnet-4.5 or openai/gpt-4o.",
  },
};

export default function AIIntegrationSettingsPage() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AIProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (connectedParam === "openrouter") {
      setMessage({
        type: "success",
        text: "Connected to OpenRouter. Your API key was saved.",
      });
    } else if (errorParam) {
      setMessage({
        type: "error",
        text: `OpenRouter sign-in error: ${errorParam.replace(/_/g, " ")}`,
      });
    }
  }, [connectedParam, errorParam]);

  const load = async () => {
    try {
      const res = await fetch("/api/settings/ai");
      if (res.ok) {
        const data = (await res.json()) as Status;
        setStatus(data);
        setSelected(data.provider);
        setModel(data.modelOverride ? data.model : "");
      }
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selected,
          apiKey: apiKey.trim() || undefined,
          model: model.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setApiKey("");
        setMessage({
          type: "success",
          text: `Saved. ${PROVIDER_INFO[selected].label} is now active.`,
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

  const clearKey = async (provider: AIProvider) => {
    if (!confirm(`Clear saved ${PROVIDER_INFO[provider].label} API key?`))
      return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/settings/ai?provider=${provider}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      setStatus(data);
      setMessage({
        type: "success",
        text: `${PROVIDER_INFO[provider].label} key cleared.`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const selectedInfo = PROVIDER_INFO[selected];
  const selectedHasKey =
    status.savedKeys[selected] || status.envKeysDetected[selected];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Sparkles className="h-7 w-7 text-purple-600" />
        AI Provider
      </h1>
      <p className="text-gray-600 mb-6">
        Choose which LLM powers audit reports and GSC suggestions. You can save
        keys for multiple providers and switch between them.
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

      {status.configured && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Check className="h-5 w-5 text-green-600" />
              Active: {PROVIDER_INFO[status.provider].label}
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                {status.model}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                source: {status.source}
              </Badge>
            </CardTitle>
            <CardDescription>
              Key{" "}
              <code className="font-mono text-xs">{status.keyPreview}</code>{" "}
              is in use. AI features in the app route through this provider.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pick a provider</CardTitle>
          <CardDescription>
            The selected provider is used for all AI calls. A check mark means a
            key is saved (or found in env).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["anthropic", "openai", "gemini", "openrouter"] as AIProvider[]).map((p) => {
              const info = PROVIDER_INFO[p];
              const isActive = selected === p;
              const hasKey = status.savedKeys[p] || status.envKeysDetected[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSelected(p);
                    setApiKey("");
                    setModel(
                      status.provider === p && status.modelOverride
                        ? status.model
                        : ""
                    );
                  }}
                  className={`border rounded-md p-4 text-left transition-colors ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{info.label}</div>
                    {hasKey && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {status.defaultModels[p]}
                  </div>
                  {status.provider === p && (
                    <Badge className="mt-2" variant="secondary">
                      Active
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configure {selectedInfo.label}</CardTitle>
          <CardDescription>
            Get an API key from{" "}
            <a
              href={selectedInfo.consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              {selectedInfo.consoleLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
            , then paste it here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected === "openrouter" && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div>
                <div className="font-medium text-blue-900">
                  Sign in with OpenRouter (recommended)
                </div>
                <p className="text-sm text-blue-800 mt-1">
                  Log in to your OpenRouter account and we&apos;ll pull in an API
                  key automatically — no manual copy-paste.
                </p>
              </div>
              <a href="/api/openrouter/authorize">
                <Button className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in with OpenRouter
                </Button>
              </a>
              <div className="flex items-center gap-3 pt-1">
                <Separator className="flex-1" />
                <span className="text-xs text-blue-700 uppercase tracking-wide">
                  or paste manually
                </span>
                <Separator className="flex-1" />
              </div>
            </div>
          )}
          {selectedInfo.note && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{selectedInfo.note}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                selectedHasKey
                  ? "Leave blank to keep the saved key"
                  : selectedInfo.keyHint
              }
              className="mt-1 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Stored in the local SQLite database. Only sent to the provider
              when making a request.
            </p>
          </div>

          <div>
            <Label htmlFor="model">
              Model{" "}
              <span className="text-gray-500 font-normal">
                (optional — defaults to{" "}
                <code className="font-mono text-xs">
                  {status.defaultModels[selected]}
                </code>
                )
              </span>
            </Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={status.defaultModels[selected]}
              className="mt-1 font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving
                ? "Saving…"
                : status.provider === selected && selectedHasKey
                  ? "Update"
                  : "Save & use this provider"}
            </Button>

            {status.savedKeys[selected] && (
              <Button
                type="button"
                variant="outline"
                onClick={() => clearKey(selected)}
                disabled={saving}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear saved key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
