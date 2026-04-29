"use client";

import { useState, useEffect, Suspense } from "react";
import { Webhook, Plus, Trash2, ToggleRight, ToggleLeft, Send, AlertCircle } from "lucide-react";

function WebhooksContent() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    event: "audit_complete",
    secret: "",
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  const eventOptions = [
    { value: "audit_complete", label: "Audit Complete" },
    { value: "findings_generated", label: "Findings Generated" },
    { value: "report_generated", label: "Report Generated" },
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/webhooks");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setError("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !formData.event) {
      setError("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      const data = await res.json();
      setWebhooks([data, ...webhooks]);
      setFormData({ name: "", url: "", event: "audit_complete", secret: "" });
      setShowForm(false);

      // Show secret once
      alert(
        `Webhook created! Secret: ${data.secret}\n\nSave this secret securely - it's needed for signature verification.`
      );
    } catch (err) {
      setError("Failed to create webhook");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setWebhooks(
        webhooks.map((wh) =>
          wh.id === id ? { ...wh, active: !currentActive } : wh
        )
      );
    } catch (err) {
      setError("Failed to toggle webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setWebhooks(webhooks.filter((wh) => wh.id !== id));
    } catch (err) {
      setError("Failed to delete webhook");
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: id }),
      });

      if (!res.ok) throw new Error("Failed to test");

      alert("Test webhook sent! Check your webhook receiver.");
    } catch (err) {
      setError("Failed to test webhook");
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4">Loading webhooks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Webhook className="h-10 w-10 text-blue-600" />
            Webhooks
          </h1>
          <p className="text-gray-600 mt-2">
            Automate actions on audit events
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Webhook
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              onClick={() => setError("")}
              className="text-sm mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Create New Webhook</h2>
          <form onSubmit={handleCreateWebhook} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Webhook Name
              </label>
              <input
                type="text"
                placeholder="e.g., Slack Notifications"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://your-domain.com/webhooks/receive"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                Must be a valid HTTPS URL that can receive POST requests
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Event</label>
              <select
                value={formData.event}
                onChange={(e) =>
                  setFormData({ ...formData, event: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {eventOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Secret (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to auto-generate"
                value={formData.secret}
                onChange={(e) =>
                  setFormData({ ...formData, secret: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                Used to generate HMAC signatures for security
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Create Webhook
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No webhooks yet</p>
          <p className="text-sm text-gray-500">
            Create a webhook to automate actions on audit events
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">{webhook.name}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {eventOptions.find((opt) => opt.value === webhook.event)
                        ?.label || webhook.event}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 break-all">
                    {webhook.url}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleActive(webhook.id, webhook.active)
                  }
                  className="p-2 rounded hover:bg-gray-100 transition-colors"
                  title={webhook.active ? "Disable" : "Enable"}
                >
                  {webhook.active ? (
                    <ToggleRight className="h-6 w-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-semibold">
                    {webhook.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-600">Disabled</span>
                    )}
                  </p>
                </div>
                {webhook.lastFiredAt && (
                  <div>
                    <p className="text-gray-600">Last Fired</p>
                    <p className="font-semibold">
                      {new Date(webhook.lastFiredAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {webhook.failCount > 0 && (
                  <div>
                    <p className="text-gray-600">Failed Attempts</p>
                    <p className="font-semibold text-red-600">
                      {webhook.failCount}
                    </p>
                  </div>
                )}
              </div>

              {webhook.lastError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
                  <p className="font-semibold">Last Error:</p>
                  <p className="break-all">{webhook.lastError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleTestWebhook(webhook.id)}
                  disabled={testingId === webhook.id}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded font-semibold hover:bg-purple-100 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Test
                </button>
                <button
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded font-semibold hover:bg-red-100 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h2 className="text-xl font-bold mb-4">Webhook Payload Format</h2>
        <pre className="bg-white p-4 rounded text-sm overflow-x-auto border border-blue-100">
{`{
  "event": "audit_complete",
  "timestamp": "2026-04-29T12:34:56.000Z",
  "data": {
    "auditId": "clx...",
    "domain": "example.com",
    "status": "completed",
    "findingsCount": 42,
    "overallScore": 75.5
  }
}`}
        </pre>
        <p className="text-sm text-blue-700 mt-4">
          The request will include a signature header:{" "}
          <code className="bg-white px-2 py-1 rounded border border-blue-200">
            X-Webhook-Signature: sha256=...
          </code>
        </p>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <WebhooksContent />
    </Suspense>
  );
}
