"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertCircle,
  FileText,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";

interface Property {
  id: string;
  siteUrl: string;
}

interface ContentIdea {
  title: string;
  targetKeyword: string;
  intent: string;
  difficulty: string;
  outline: string[];
  rationale: string;
  estimatedWordCount: number;
  suggestedSlug: string;
}

export default function ContentIdeasPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/gsc/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
        if (data.properties?.length > 0) {
          setSelectedPropertyId(data.properties[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const generateIdeas = async () => {
    if (!selectedPropertyId) {
      setError("Please select a property");
      return;
    }

    setGenerating(true);
    setError("");
    setIdeas([]);

    try {
      const res = await fetch("/api/content-ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: selectedPropertyId }),
      });

      const data = await res.json();

      if (res.ok) {
        setIdeas(data.contentPlan.ideas);
        setStats(data);
      } else {
        setError(data.error || "Failed to generate ideas");
      }
    } catch (err) {
      setError("Error generating ideas");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "low":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      case "medium":
        return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "high":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Sparkles className="h-10 w-10 text-purple-600" />
            Content Ideas
          </h1>
          <p className="text-muted-foreground">
            Generate AI-powered content ideas based on your GSC queries, rankings,
            and website structure.
          </p>
        </div>
        <button
          onClick={generateIdeas}
          disabled={generating || !selectedPropertyId || properties.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          <Sparkles className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : "Generate Ideas"}
        </button>
      </div>

      {/* Property Selector */}
      {properties.length > 0 ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <label className="block text-sm font-semibold mb-2">
            Select Property
          </label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-border rounded-lg bg-background"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.siteUrl.replace(/^sc-domain:/, "").replace(/\/$/, "")}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
          <p className="text-amber-800 font-semibold mb-2">No properties</p>
          <p className="text-amber-700 text-sm mb-4">
            Connect a Google Search Console property first.
          </p>
          <Link href="/properties">
            <button className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">
              Go to Properties
            </button>
          </Link>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Quick Wins</p>
            <p className="text-2xl font-bold">
              {stats.contentPlan.quickWinsGenerated}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Topic Expansions</p>
            <p className="text-2xl font-bold">
              {stats.contentPlan.topicExpansions}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Sitemap URLs</p>
            <p className="text-2xl font-bold">
              {stats.sitemapInfo.entriesFetched}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">GSC Queries</p>
            <p className="text-2xl font-bold">{stats.gscData.queriesFetched}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">{error}</p>
          </div>
        </div>
      )}

      {/* Ideas Grid */}
      {ideas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Generated Ideas ({ideas.length})</h2>
          </div>
          <div className="grid gap-4">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-6 hover:border-purple-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Target: <span className="font-semibold">{idea.targetKeyword}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(idea.title, idx.toString())}
                    className="p-2 hover:bg-muted rounded transition-colors"
                    title="Copy title"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${getDifficultyColor(
                      idea.difficulty
                    )}`}
                  >
                    {idea.difficulty.charAt(0).toUpperCase() +
                      idea.difficulty.slice(1)}{" "}
                    Difficulty
                  </span>
                  <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-200">
                    {idea.estimatedWordCount} words
                  </span>
                  <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-500/10 text-gray-700 border border-gray-200">
                    {idea.intent}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {idea.rationale}
                </p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Outline
                  </p>
                  <ul className="text-sm space-y-1">
                    {idea.outline.map((section, i) => (
                      <li key={i} className="text-muted-foreground">
                        • {section}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Link href={`/content/drafts?create=${idea.suggestedSlug}`}>
                    <button className="flex items-center gap-1 text-sm px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                      <Plus className="h-4 w-4" />
                      Create Draft
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!generating && ideas.length === 0 && !error && (
        <div className="text-center py-12 rounded-lg border-2 border-dashed border-border">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ideas generated yet</h3>
          <p className="text-muted-foreground mb-4">
            Select a property and click "Generate Ideas" to create AI-powered
            content recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
