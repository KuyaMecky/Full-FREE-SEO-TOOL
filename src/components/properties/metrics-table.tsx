"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface MetricRow {
  key: string; // the label (query string or page URL)
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

type SortKey = "key" | "impressions" | "clicks" | "ctr" | "position";
type SortDir = "asc" | "desc";

interface Props {
  keyLabel: string;
  rows: MetricRow[];
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

export function MetricsTable({ keyLabel, rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    const filtered = filter
      ? rows.filter((r) =>
          r.key.toLowerCase().includes(filter.toLowerCase())
        )
      : rows;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return copy;
  }, [rows, sortKey, sortDir, filter]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir(k === "position" ? "asc" : "desc");
    }
  };

  const SortHeader = ({
    label,
    k,
    align = "left",
  }: {
    label: string;
    k: SortKey;
    align?: "left" | "right";
  }) => (
    <TableHead
      className={`cursor-pointer select-none ${align === "right" ? "text-right" : ""}`}
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k &&
          (sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder={`Filter ${keyLabel.toLowerCase()}…`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "row" : "rows"}
        </div>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label={keyLabel} k="key" />
              <SortHeader label="Impressions" k="impressions" align="right" />
              <SortHeader label="Clicks" k="clicks" align="right" />
              <SortHeader label="CTR" k="ctr" align="right" />
              <SortHeader label="Avg. Position" k="position" align="right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.slice(0, 500).map((r) => (
              <TableRow key={r.key}>
                <TableCell className="max-w-md truncate">{r.key}</TableCell>
                <TableCell className="text-right">
                  {r.impressions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {r.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(r.ctr)}
                </TableCell>
                <TableCell className="text-right">
                  {r.position.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {sorted.length > 500 && (
        <div className="text-sm text-muted-foreground">
          Showing first 500 of {sorted.length} rows. Use the filter to narrow.
        </div>
      )}
    </div>
  );
}
