'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Play, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  event: string;
  active: boolean;
  secret?: string;
  failCount: number;
  lastError?: string;
  lastFiredAt?: string;
}

export function WebhooksSettings() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    event: 'audit_complete',
    secret: '',
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch('/api/webhooks');
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      setMessage({ type: 'error', text: 'Failed to load webhooks' });
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook() {
    if (!newWebhook.name || !newWebhook.url) {
      setMessage({ type: 'error', text: 'Name and URL are required' });
      return;
    }

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create webhook');
      }

      const data = await res.json();
      setWebhooks([...webhooks, data.webhook]);
      setNewWebhook({ name: '', url: '', event: 'audit_complete', secret: '' });
      setIsCreating(false);
      setMessage({ type: 'success', text: 'Webhook created successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create webhook' });
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return;

    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');

      setWebhooks(webhooks.filter((w) => w.id !== id));
      setMessage({ type: 'success', text: 'Webhook deleted' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete webhook' });
    }
  }

  async function testWebhook(id: string) {
    setTesting(id);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: id }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Test webhook sent successfully' });
      } else {
        setMessage({ type: 'error', text: `Test failed: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test webhook' });
    } finally {
      setTesting(null);
    }
  }

  async function toggleWebhook(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });

      if (!res.ok) throw new Error('Failed to update webhook');

      setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, active: !active } : w)));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update webhook' });
    }
  }

  if (loading) {
    return <div className="p-6">Loading webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-sm text-gray-400 mt-1">Integrate with n8n and other automation platforms</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition"
        >
          <Plus size={18} />
          New Webhook
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-900/30 border border-green-700 text-green-200'
            : 'bg-red-900/30 border border-red-700 text-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {isCreating && (
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50 space-y-4">
          <h3 className="font-semibold">Create New Webhook</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              placeholder="My n8n workflow"
              value={newWebhook.name}
              onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Webhook URL</label>
            <input
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/..."
              value={newWebhook.url}
              onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Copy the webhook URL from your n8n workflow</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event</label>
            <select
              value={newWebhook.event}
              onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="audit_complete">Audit Complete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Secret (Optional)</label>
            <input
              type="password"
              placeholder="For HMAC verification"
              value={newWebhook.secret}
              onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Optional: Add a secret for HMAC signature verification</p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={createWebhook}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div className="border border-gray-700 rounded-lg p-8 text-center text-gray-400">
          <p>No webhooks configured yet</p>
          <p className="text-sm mt-2">Create one to integrate with n8n workflows</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{webhook.name}</h3>
                    <button
                      onClick={() => toggleWebhook(webhook.id, webhook.active)}
                      className={`text-xs px-2 py-1 rounded transition ${
                        webhook.active
                          ? 'bg-green-900/30 text-green-200 border border-green-700'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {webhook.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-2 break-all">{webhook.url}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="text-gray-500">Event: {webhook.event}</span>
                    {webhook.failCount > 0 && (
                      <span className="text-yellow-400">
                        {webhook.failCount} failures
                      </span>
                    )}
                    {webhook.lastError && (
                      <span className="text-red-400">Error: {webhook.lastError}</span>
                    )}
                    {webhook.lastFiredAt && !webhook.lastError && (
                      <span className="text-green-400">
                        Last fired: {new Date(webhook.lastFiredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => testWebhook(webhook.id)}
                    disabled={testing === webhook.id}
                    className="p-2 text-gray-400 hover:text-blue-400 disabled:opacity-50 transition"
                    title="Send test webhook"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => deleteWebhook(webhook.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition"
                    title="Delete webhook"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h4 className="font-medium text-blue-200 mb-2">Quick Start</h4>
        <ol className="text-xs text-blue-100 space-y-1 list-decimal list-inside">
          <li>Create a webhook trigger in n8n and copy the URL</li>
          <li>Click "New Webhook" above and paste the URL</li>
          <li>Click the play button to send a test webhook</li>
          <li>Check your n8n workflow received the event</li>
          <li>Add more n8n nodes (Slack, Email, etc.) to your workflow</li>
        </ol>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <h4 className="font-medium mb-2">Webhook Events</h4>
        <div className="text-xs text-gray-400 space-y-2">
          <div>
            <p className="font-medium text-gray-300">audit_complete</p>
            <p>Fired when an audit finishes analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
