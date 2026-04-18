"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trash2, ArrowRight } from "lucide-react";

interface Audit {
  id: string;
  domain: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  crawling: "bg-blue-500",
  analyzing: "bg-purple-500",
  complete: "bg-green-500",
  error: "bg-red-500",
};

export default function HistoryPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (error) {
      console.error("Failed to fetch audits:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAudit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this audit?")) return;

    try {
      const res = await fetch(`/api/audit/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAudits(audits.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete audit:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground/70";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your previous SEO audits
          </p>
        </div>
        <Link href="/audit/new">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No audits yet</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Get started by running your first SEO audit
            </p>
            <Link href="/audit/new">
              <Button>Start New Audit</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => (
            <Card key={audit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {audit.domain}
                      </h3>
                      <Badge
                        className={`${statusColors[audit.status] || "bg-gray-500"} text-white`}
                      >
                        {audit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {formatDate(audit.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p
                        className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}
                      >
                        {audit.overallScore !== null
                          ? Math.round(audit.overallScore)
                          : "-"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/audit/${audit.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          View
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteAudit(audit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
