"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Zap, Lightbulb, ArrowRight } from "lucide-react";

interface ContentSuggestion {
  id: string;
  title: string;
  keyword: string;
  difficulty: string;
  intent: string;
  outline: string[];
  rationale: string;
  wordCount: number;
  slug: string;
  linkedQuickWin: string | null;
}

export function SuggestionsTab({ auditId, propertyId }: { auditId: string; propertyId?: string }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}/suggestions`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        } else {
          setError("Failed to load suggestions");
        }
      } catch {
        setError("Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    })();
  }, [auditId]);

  const handleGenerateContent = async (suggestion: ContentSuggestion) => {
    setGenerating(suggestion.id);
    try {
      // If no propertyId, create a draft without property link
      const draftData: Record<string, unknown> = {
        title: suggestion.title,
        slug: suggestion.slug,
        focusKeyword: suggestion.keyword,
        metaTitle: `${suggestion.title} | SEO Guide`,
        metaDescription: suggestion.rationale.slice(0, 158),
        gscSignals: {
          keyword: suggestion.keyword,
          difficulty: suggestion.difficulty,
          intent: suggestion.intent,
        },
      };

      if (propertyId) {
        draftData.propertyId = propertyId;
      }

      const res = await fetch("/api/content/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });

      if (res.ok) {
        const { draft } = await res.json();
        router.push(`/content/drafts/${draft.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create draft");
      }
    } catch (err) {
      setError("Failed to create draft");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-500/10">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span className="text-amber-800 dark:text-amber-300">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg">No suggestions yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Content suggestions appear after auditing your site's structure and identifying quick wins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-500/10">
        <CardContent className="flex items-start gap-3 py-4 text-sm">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-blue-800 dark:text-blue-300">
            <strong>Quick Wins:</strong> These content ideas target keyword gaps identified in your audit and are tied to high-impact SEO opportunities.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight">{suggestion.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Focus keyword: <code className="bg-muted px-2 py-1 rounded text-xs font-semibold">{suggestion.keyword}</code>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      suggestion.difficulty === "low"
                        ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                        : suggestion.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                    }`}
                  >
                    {suggestion.difficulty}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {suggestion.linkedQuickWin && (
                <div className="text-sm bg-muted/50 border border-border rounded-lg p-3">
                  <p className="font-semibold text-xs text-muted-foreground mb-1">TIED TO QUICK WIN</p>
                  <p className="text-foreground">{suggestion.linkedQuickWin}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium">Search Intent</p>
                  <p className="text-foreground capitalize">{suggestion.intent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Target Word Count</p>
                  <p className="text-foreground">{suggestion.wordCount.toLocaleString()} words</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground font-medium text-sm mb-2">Why create this?</p>
                <p className="text-sm text-foreground/80">{suggestion.rationale}</p>
              </div>

              {suggestion.outline.length > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium text-sm mb-2">Suggested outline</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/70">
                    {suggestion.outline.slice(0, 4).map((section, i) => (
                      <li key={i} className="truncate">{section}</li>
                    ))}
                    {suggestion.outline.length > 4 && (
                      <li className="text-muted-foreground italic">+{suggestion.outline.length - 4} more sections</li>
                    )}
                  </ol>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleGenerateContent(suggestion)}
                  disabled={generating === suggestion.id}
                  className="gap-2"
                >
                  {generating === suggestion.id ? "Creating draft..." : "Generate Content"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
