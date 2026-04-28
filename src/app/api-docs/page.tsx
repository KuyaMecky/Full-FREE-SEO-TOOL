"use client";

import Link from "next/link";
import { ArrowRight, Code, BookOpen, Zap, Github, ExternalLink } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-20">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">API Documentation</p>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
            Build with SEO Audit Pro
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Integrate enterprise-grade SEO analysis into your applications with our simple REST API.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          <a href="#getting-started" className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
            <p className="font-semibold text-sm mb-1">Getting Started</p>
            <p className="text-xs text-muted-foreground">5 minutes to first audit</p>
          </a>
          <a href="#endpoints" className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
            <p className="font-semibold text-sm mb-1">API Endpoints</p>
            <p className="text-xs text-muted-foreground">Create, get, and manage audits</p>
          </a>
          <a href="#examples" className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
            <p className="font-semibold text-sm mb-1">Code Examples</p>
            <p className="text-xs text-muted-foreground">Node.js, Python, cURL</p>
          </a>
        </div>
      </div>

      {/* Getting Started Section */}
      <div id="getting-started" className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-4">Getting Started</h2>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                Generate API Key
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Go to Settings → Developer to generate your API key. Keep it secret!
              </p>
              <Link href="/settings" className="text-sm text-primary hover:underline flex items-center gap-1">
                Go to Settings <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                Make Your First Request
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an audit with a simple POST request:
              </p>
              <div className="bg-muted rounded p-4 overflow-x-auto">
                <code className="text-xs font-mono whitespace-nowrap">
{`curl -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "example.com"}'`}
                </code>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                Get Results
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Poll the endpoint until the audit is complete (usually 2-5 minutes):
              </p>
              <div className="bg-muted rounded p-4 overflow-x-auto">
                <code className="text-xs font-mono whitespace-nowrap">
{`curl https://full-free-seo-tool.vercel.app/api/public/audits/AUDIT_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints Section */}
      <div id="endpoints" className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-4">API Endpoints</h2>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold">Create Audit</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a new website audit</p>
                </div>
                <span className="text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">POST</span>
              </div>
              <code className="text-sm font-mono bg-muted rounded p-3 block">/api/public/audits/create</code>
              <p className="text-sm text-muted-foreground mt-3">
                Parameters: <code className="bg-muted px-1 rounded">domain</code> (required), <code className="bg-muted px-1 rounded">maxPages</code> (optional)
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold">Get Audit Results</p>
                  <p className="text-xs text-muted-foreground mt-1">Fetch completed audit results</p>
                </div>
                <span className="text-xs font-semibold bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded">GET</span>
              </div>
              <code className="text-sm font-mono bg-muted rounded p-3 block">/api/public/audits/:auditId</code>
              <p className="text-sm text-muted-foreground mt-3">
                Returns: Domain, score, pages analyzed, crawl results
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold">Manage API Keys</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate, list, and revoke API keys</p>
                </div>
                <span className="text-xs font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">REST</span>
              </div>
              <code className="text-sm font-mono bg-muted rounded p-3 block">/api/apikeys</code>
              <p className="text-sm text-muted-foreground mt-3">
                Methods: GET (list), POST (create), DELETE (revoke)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div id="examples" className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-6">
        <h2 className="text-3xl font-bold">Code Examples</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              JavaScript
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Complete Node.js client with polling and error handling
            </p>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#javascriptnodejs" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Example <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              Python
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Python client library with async support
            </p>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#python" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Example <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              Slack Bot
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Run audits directly from Slack with /audit command
            </p>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#slack-bot" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Example <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              WordPress Plugin
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Display audit scores on WordPress posts
            </p>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#wordpress-plugin" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Example <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Capabilities</h2>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <Zap className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Real-Time Crawling</p>
              <p className="text-sm text-muted-foreground">Analyze up to 500 pages per audit</p>
            </div>
          </div>

          <div className="flex gap-4">
            <BookOpen className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Technical SEO Analysis</p>
              <p className="text-sm text-muted-foreground">Meta tags, headings, links, images, and more</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Code className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">REST API</p>
              <p className="text-sm text-muted-foreground">Simple JSON-based API for easy integration</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Github className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Open Source</p>
              <p className="text-sm text-muted-foreground">Full source code available on GitHub</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Generate your API key and start integrating in minutes
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/settings" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Generate API Key
            </Link>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-semibold flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 border-t border-border text-center text-sm text-muted-foreground">
        <p>
          Full documentation available at{" "}
          <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/API_REFERENCE.md" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            API_REFERENCE.md
          </a>
        </p>
        <p className="mt-2">
          Questions? Email{" "}
          <a href="mailto:support@example.com" className="text-primary hover:underline">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  );
}
