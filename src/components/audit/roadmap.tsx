import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoadmapItem } from "@/types/audit";
import { Calendar, Users, Target } from "lucide-react";

interface RoadmapProps {
  roadmap: RoadmapItem[];
}

export function Roadmap({ roadmap }: RoadmapProps) {
  const phases = [
    { key: "30-day", label: "30 Days - Quick Wins", color: "bg-green-500" },
    { key: "60-day", label: "60 Days - Strategic Improvements", color: "bg-blue-500" },
    { key: "90-day", label: "90 Days - Long-term Goals", color: "bg-purple-500" },
  ];

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const phaseItems = roadmap.filter((item) => item.phase === phase.key);

        return (
          <Card key={phase.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${phase.color}`} />
                {phase.label}
                <span className="text-sm font-normal text-gray-500">
                  ({phaseItems.length} tasks)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {phaseItems.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No tasks scheduled for this phase
                </p>
              ) : (
                <div className="space-y-4">
                  {phaseItems.map((item, index) => (
                    <div
                      key={index}
                      className="border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900">{item.task}</h4>
                        <Badge className={priorityColors[item.priority]}>
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {item.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {item.expectedImpact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
