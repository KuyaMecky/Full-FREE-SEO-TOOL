"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/types/audit";

interface HealthScorecardProps {
  scorecard: ScoreCard;
}

export function HealthScorecard({ scorecard }: HealthScorecardProps) {
  const categories = [
    { key: "overall", label: "Overall", score: scorecard.overall },
    { key: "technical", label: "Technical SEO", score: scorecard.technical },
    { key: "onPage", label: "On-Page", score: scorecard.onPage },
    { key: "content", label: "Content", score: scorecard.content },
    { key: "uxPerformance", label: "UX/Performance", score: scorecard.uxPerformance },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    if (score >= 40) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Critical";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {categories.map((cat) => (
        <Card key={cat.key} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div
                className={`text-4xl font-bold mb-2 ${
                  cat.key === "overall" ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {Math.round(cat.score)}
              </div>
              <p className="text-sm text-gray-500 mb-2">{cat.label}</p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getScoreColor(
                  cat.score
                )}`}
              >
                {getScoreLabel(cat.score)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
