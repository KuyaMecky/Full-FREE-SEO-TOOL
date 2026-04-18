import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionItem } from "@/types/audit";
import { ArrowUp, Zap, Clock, Users } from "lucide-react";

interface ActionItemsProps {
  actionItems: ActionItem[];
}

export function ActionItems({ actionItems }: ActionItemsProps) {
  const effortColors: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Top 5 Priority Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionItems.slice(0, 5).map((item) => (
            <div
              key={item.rank}
              className="flex items-start gap-4 p-4 bg-muted/40 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {item.rank}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{item.action}</h4>
                <p className="text-sm text-muted-foreground mt-1">{item.impact}</p>
                <div className="flex gap-3 mt-2">
                  <Badge className={effortColors[item.effort.toLowerCase()]}>
                    {item.effort} effort
                  </Badge>
                  <Badge variant="outline">{item.owner}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
