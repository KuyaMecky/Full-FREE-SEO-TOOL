"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuggestionsOutput } from "@/lib/ai/suggestions";

export function SuggestionsList({ data }: { data: SuggestionsOutput }) {
  const { titleRewrites, contentAngles, internalLinkIdeas } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Title rewrites
            <Badge variant="secondary">{titleRewrites.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {titleRewrites.length === 0 ? (
            <p className="text-sm text-gray-500">No title rewrite opportunities found.</p>
          ) : (
            <ul className="space-y-4">
              {titleRewrites.map((t, i) => (
                <li key={i} className="border-l-2 border-blue-500 pl-4">
                  <div className="text-xs text-gray-500 mb-1">
                    Query: &quot;{t.query}&quot; · position {t.currentPosition.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mb-2 truncate">
                    Page: {t.targetPage}
                  </div>
                  <div className="font-medium">{t.suggestedTitle}</div>
                  <div className="text-sm text-gray-600 mt-1">{t.rationale}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Content angles
            <Badge variant="secondary">{contentAngles.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentAngles.length === 0 ? (
            <p className="text-sm text-gray-500">No content angles found.</p>
          ) : (
            <ul className="space-y-4">
              {contentAngles.map((c, i) => (
                <li key={i} className="border-l-2 border-purple-500 pl-4">
                  <div className="text-xs text-gray-500 mb-1">Query: &quot;{c.query}&quot;</div>
                  <div className="font-medium">{c.angle}</div>
                  <div className="text-sm text-gray-600 mt-1">{c.rationale}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Internal link ideas
            <Badge variant="secondary">{internalLinkIdeas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {internalLinkIdeas.length === 0 ? (
            <p className="text-sm text-gray-500">No internal link opportunities found.</p>
          ) : (
            <ul className="space-y-4">
              {internalLinkIdeas.map((l, i) => (
                <li key={i} className="border-l-2 border-green-500 pl-4">
                  <div className="text-xs text-gray-500 mb-1 truncate">
                    {l.fromPage} → {l.toPage}
                  </div>
                  <div className="font-medium">Anchor: &quot;{l.anchorText}&quot;</div>
                  <div className="text-sm text-gray-600 mt-1">{l.rationale}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
