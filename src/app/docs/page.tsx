"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Code, ExternalLink, Menu, X } from "lucide-react";

const DOCS = [
  {
    id: "api-reference",
    title: "API Reference",
    description: "Complete API endpoint documentation with examples",
    icon: "📚",
  },
  {
    id: "public-api",
    title: "Public API Guide",
    description: "Getting started with the public API",
    icon: "🔌",
  },
  {
    id: "oauth-setup",
    title: "OAuth Setup",
    description: "Set up GitHub and Gmail OAuth authentication",
    icon: "🔐",
  },
  {
    id: "integration-examples",
    title: "Integration Examples",
    description: "Real-world examples (Slack, WordPress, Discord)",
    icon: "🔗",
  },
];

const DOC_CONTENT: Record<string, string> = {
  "api-reference": `# API Reference

Complete API documentation for SEO Audit Pro.

## Base URL
\`\`\`
https://full-free-seo-tool.vercel.app/api/public
\`\`\`

## Authentication

All requests require an API key in the Authorization header:

\`\`\`bash
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Create Audit
\`POST /audits/create\`

Create a new website audit.

**Parameters:**
- \`domain\` (required): Website domain
- \`maxPages\` (optional): Max pages to crawl (1-500)

**Example:**
\`\`\`bash
curl -X POST https://full-free-seo-tool.vercel.app/api/public/audits/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "example.com", "maxPages": 50}'
\`\`\`

### Get Audit Results
\`GET /audits/:auditId\`

Fetch completed audit results.

**Example:**
\`\`\`bash
curl https://full-free-seo-tool.vercel.app/api/public/audits/AUDIT_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

## Rate Limiting

- **Free Plan**: 50 audits/month
- **Pro Plan**: Unlimited (coming soon)

## Error Handling

### 401 Unauthorized
Missing or invalid API key.

### 404 Not Found
Audit not found or you don't have access.

### 429 Too Many Requests
Rate limit exceeded. Wait before retrying.

---

For the full documentation, visit [API_REFERENCE.md](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/API_REFERENCE.md) on GitHub.`,

  "public-api": `# Public API Guide

Get started with the SEO Audit Pro API in 5 minutes.

## Step 1: Generate API Key

1. Go to [Settings](/settings)
2. Scroll to "Developer" section
3. Click "Generate New Key"
4. Copy the key (shown only once!)

## Step 2: Make Your First Request

\`\`\`javascript
const response = await fetch('https://full-free-seo-tool.vercel.app/api/public/audits/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    domain: 'example.com',
    maxPages: 50
  })
});

const { auditId } = await response.json();
console.log('Audit started:', auditId);
\`\`\`

## Step 3: Wait for Results

\`\`\`javascript
async function waitForResults(auditId) {
  let completed = false;

  while (!completed) {
    const res = await fetch(
      \`https://full-free-seo-tool.vercel.app/api/public/audits/\${auditId}\`,
      {
        headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
      }
    );

    const audit = await res.json();

    if (audit.status === 'complete') {
      return audit;
    }

    console.log('Status:', audit.status);
    await new Promise(r => setTimeout(r, 2000));
  }
}
\`\`\`

## Examples

- [JavaScript](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#javascriptnodejs)
- [Python](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#python)
- [Slack Bot](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#slack-bot)
- [WordPress Plugin](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#wordpress-plugin)`,

  "oauth-setup": `# OAuth Setup Guide

Enable GitHub and Gmail authentication for your users.

## GitHub OAuth

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: SEO Audit Pro
   - **Homepage URL**: https://full-free-seo-tool.vercel.app
   - **Authorization callback URL**: https://full-free-seo-tool.vercel.app/api/auth/github

4. Copy **Client ID** and **Client Secret**

### 2. Add to Vercel

1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Add:
   - \`GITHUB_CLIENT_ID\` = Your Client ID
   - \`GITHUB_CLIENT_SECRET\` = Your Client Secret
   - \`GITHUB_REDIRECT_URI\` = https://full-free-seo-tool.vercel.app/api/auth/github

4. Redeploy

## Gmail/Google OAuth

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Web Application
5. Add redirect URI:
   - https://full-free-seo-tool.vercel.app/api/auth/google

6. Copy **Client ID** and **Client Secret**

### 2. Add to Vercel

1. Go to Vercel project settings
2. Add environment variables:
   - \`GOOGLE_CLIENT_ID\` = Your Client ID
   - \`GOOGLE_CLIENT_SECRET\` = Your Client Secret
   - \`GOOGLE_REDIRECT_URI\` = https://full-free-seo-tool.vercel.app/api/auth/google

3. Redeploy

## Testing

Visit the login page: https://full-free-seo-tool.vercel.app/login

You should see buttons for:
- Sign in with GitHub
- Sign in with Google`,

  "integration-examples": `# Integration Examples

Real-world examples of integrating the SEO Audit Pro API.

## Slack Bot

Post audit results to Slack with the \`/audit\` command.

\`\`\`javascript
// Command: /audit example.com
// Sends real-time results to Slack channel
\`\`\`

[View Full Code](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#slack-bot)

## WordPress Plugin

Display SEO scores on WordPress posts.

\`\`\`php
<?php
// Shows audit score in WordPress post widget
?>
\`\`\`

[View Full Code](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#wordpress-plugin)

## Discord Bot

Real-time audit notifications in Discord.

\`\`\`javascript
// Command: !audit example.com
// Posts embed with score and issues
\`\`\`

[View Full Code](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#discord-bot)

## Google Sheets

Log all audit results to Google Sheets automatically.

[View Full Code](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#google-sheets)

## Zapier

Trigger actions based on audit results:
- Send Slack alerts
- Create Sheet rows
- Send email reports

[View Full Code](https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/blob/main/docs/INTEGRATION_EXAMPLES.md#zapierautomations)`,
};

export default function DocsPage() {
  const [selectedDoc, setSelectedDoc] = useState<string>("api-reference");
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentDoc = DOCS.find(d => d.id === selectedDoc);
  const content = DOC_CONTENT[selectedDoc] || "";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${mobileOpen ? "block" : "hidden"} md:block md:w-64 border-r border-border bg-muted/30 overflow-y-auto`}>
          <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-between md:justify-start gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5" />
              Docs
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {DOCS.map(doc => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedDoc === doc.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <p className="font-semibold text-sm">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              </button>
            ))}

            <div className="pt-4 border-t border-border space-y-2">
              <a
                href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
              >
                <Code className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
              <Link
                href="/api-docs"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                API Docs
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top bar mobile */}
          <div className="md:hidden sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
            <p className="font-semibold">{currentDoc?.title}</p>
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto p-6 md:p-8">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                }
                if (line.startsWith('`')) {
                  return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm">{line.slice(1, -1)}</code>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-6 mb-1">{line.slice(2)}</li>;
                }
                if (line.startsWith('[')) {
                  const match = line.match(/\[(.*?)\]\((.*?)\)/);
                  if (match) {
                    return (
                      <a
                        key={i}
                        href={match[2]}
                        target={match[2].startsWith('http') ? '_blank' : undefined}
                        rel={match[2].startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-primary hover:underline"
                      >
                        {match[1]}
                      </a>
                    );
                  }
                }
                if (line.startsWith('```')) {
                  return null;
                }
                if (line.trim()) {
                  return <p key={i} className="text-muted-foreground mb-3 leading-relaxed">{line}</p>;
                }
                return <br key={i} />;
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                For the complete, detailed documentation, visit{" "}
                <a
                  href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL/tree/main/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  the docs folder on GitHub
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
