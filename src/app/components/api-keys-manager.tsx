"use client";

import { useState, useEffect } from "react";
import { Copy, Trash2, Plus, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; keyId: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/apikeys");
      if (!res.ok) throw new Error("Failed to fetch keys");
      const data = await res.json();
      setKeys(data.keys || []);
      setError("");
    } catch (err) {
      setError("Failed to load API keys");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setError("Key name is required");
      return;
    }

    try {
      setGeneratingKey(true);
      setError("");
      const res = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate key");
      }

      const data = await res.json();
      setNewKey(data);
      setNewKeyName("");
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure? This will disable the API key immediately.")) {
      return;
    }

    try {
      setRevoking(keyId);
      setError("");
      const res = await fetch("/api/apikeys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!res.ok) throw new Error("Failed to revoke key");
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Generate API keys to integrate your app with external services
        </p>
      </div>

      {error && (
        <div className="p-4 rounded border border-red-500/30 bg-red-500/10 text-red-600 text-sm">
          {error}
        </div>
      )}

      {newKey && (
        <div className="p-4 rounded border border-green-500/30 bg-green-500/10 space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">API Key Generated!</span>
          </div>
          <p className="text-sm text-green-600/80">
            Copy this key and save it somewhere safe. You won't be able to see it again.
          </p>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={newKey.key}
              readOnly
              className="flex-1 px-3 py-2 rounded border border-green-500/30 bg-green-500/5 text-sm font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 rounded border border-green-500/30 hover:bg-green-500/10 transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={handleCopyKey}
              className="px-3 py-2 rounded border border-green-500/30 hover:bg-green-500/10 transition-colors flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="w-full py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      )}

      {!newKey && (
        <form onSubmit={handleGenerateKey} className="space-y-3 p-4 rounded border border-border bg-muted/30">
          <div>
            <label className="text-sm font-medium block mb-1">Key Name</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., My App, Production Server"
              className="w-full px-3 py-2 rounded border border-border text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={generatingKey || !newKeyName.trim()}
            className="w-full py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generatingKey ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate New Key
              </>
            )}
          </button>
        </form>
      )}

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Your API Keys</h4>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 rounded border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No API keys yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className={`p-3 rounded border ${
                  key.revokedAt
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-border bg-card hover:bg-muted/50"
                } transition-colors`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm break-words">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.prefix}...</p>
                  </div>
                  {key.revokedAt && (
                    <span className="text-xs font-semibold text-red-600 bg-red-500/10 px-2 py-1 rounded ml-2 shrink-0">
                      Revoked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                  <div>
                    <span className="block font-medium">Created</span>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="block font-medium">Last Used</span>
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                  </div>
                </div>

                {!key.revokedAt && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    disabled={revoking === key.id}
                    className="w-full py-1.5 rounded text-sm font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {revoking === key.id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        Revoke
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded border border-border bg-muted/30 text-sm space-y-2">
        <p className="font-medium">How to use your API key:</p>
        <code className="block bg-background p-2 rounded text-xs font-mono break-all">
          Authorization: Bearer YOUR_API_KEY
        </code>
        <p className="text-xs text-muted-foreground">
          See <a href="/docs/PUBLIC_API.md" className="text-primary hover:underline">API documentation</a> for
          examples
        </p>
      </div>
    </div>
  );
}
