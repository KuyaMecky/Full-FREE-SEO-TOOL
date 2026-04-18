"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FindingData } from "@/types/audit";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface FindingsTableProps {
  findings: FindingData[];
}

export function FindingsTable({ findings }: FindingsTableProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const severityColors: Record<string, string> = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-black",
    low: "bg-blue-500 text-white",
  };

  const categoryLabels: Record<string, string> = {
    technical: "Technical SEO",
    "on-page": "On-Page SEO",
    content: "Content",
    "ux-performance": "UX/Performance",
  };

  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      search === "" ||
      finding.issue.toLowerCase().includes(search.toLowerCase()) ||
      finding.evidence.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || finding.severity === severityFilter;

    const matchesCategory =
      categoryFilter === "all" || finding.category === categoryFilter;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search findings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="technical">Technical SEO</SelectItem>
            <SelectItem value="on-page">On-Page SEO</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="ux-performance">UX/Performance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Affected URLs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFindings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-8"
                >
                  No findings match your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredFindings.map((finding, index) => (
                <>
                  <TableRow
                    key={index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleRow(index)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {expandedRows.has(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{finding.issue}</TableCell>
                    <TableCell>
                      {categoryLabels[finding.category] || finding.category}
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[finding.severity]}>
                        {finding.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{finding.owner}</TableCell>
                    <TableCell className="text-right">
                      {finding.affectedUrls.length}
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(index) && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={6} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Evidence:
                            </p>
                            <p className="text-sm text-gray-600">
                              {finding.evidence}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Impact:
                            </p>
                            <p className="text-sm text-gray-600">
                              {finding.impact}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Recommended Fix:
                            </p>
                            <p className="text-sm text-gray-600">
                              {finding.recommendedFix}</p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span>
                              <span className="font-medium">Effort:</span>{" "}
                              {finding.effort}
                            </span>
                            <span>
                              <span className="font-medium">Priority:</span>{" "}
                              {finding.priority}
                            </span>
                          </div>
                          {finding.affectedUrls.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Affected URLs:
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1 mt-1">
                                {finding.affectedUrls.slice(0, 5).map((url, i) => (
                                  <li key={i} className="font-mono text-xs">
                                    {url}
                                  </li>
                                ))}
                                {finding.affectedUrls.length > 5 && (
                                  <li className="text-gray-500">
                                    ...and {finding.affectedUrls.length - 5} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filteredFindings.length} of {findings.length} findings
      </p>
    </div>
  );
}
