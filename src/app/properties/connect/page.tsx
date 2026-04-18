"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Check, AlertCircle, Search } from "lucide-react";

interface Site {
  siteUrl: string;
  permissionLevel: string;
  added: boolean;
}

export default function ConnectPropertyPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addingOne, setAddingOne] = useState<string | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch("/api/gsc/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites);
        setGoogleEmail(data.googleEmail);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load sites");
      }
    } catch (err) {
      setError("Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = useMemo(() => {
    if (!filter) return sites;
    const q = filter.toLowerCase();
    return sites.filter((s) => s.siteUrl.toLowerCase().includes(q));
  }, [sites, filter]);

  const selectableUrls = useMemo(
    () => filteredSites.filter((s) => !s.added).map((s) => s.siteUrl),
    [filteredSites]
  );
  const allVisibleSelected =
    selectableUrls.length > 0 &&
    selectableUrls.every((u) => selected.has(u));

  const toggle = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        selectableUrls.forEach((u) => next.delete(u));
      } else {
        selectableUrls.forEach((u) => next.add(u));
      }
      return next;
    });
  };

  const addOne = async (siteUrl: string) => {
    setAddingOne(siteUrl);
    try {
      const res = await fetch("/api/gsc/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/properties/${data.property.id}?autofetch=1`);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to add property");
        setAddingOne(null);
      }
    } catch {
      setError("Failed to add property");
      setAddingOne(null);
    }
  };

  const addSelected = async () => {
    const urls = Array.from(selected);
    if (urls.length === 0) return;
    setBulkAdding(true);
    setError("");
    setBulkProgress({ done: 0, total: urls.length });

    const failed: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      const siteUrl = urls[i];
      try {
        const res = await fetch("/api/gsc/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteUrl }),
        });
        if (!res.ok) {
          failed.push(siteUrl);
        }
      } catch {
        failed.push(siteUrl);
      }
      setBulkProgress({ done: i + 1, total: urls.length });
    }

    setBulkAdding(false);

    if (failed.length > 0) {
      setError(
        `Added ${urls.length - failed.length} of ${urls.length}. Failed: ${failed.join(", ")}`
      );
      setSelected(new Set(failed));
      setBulkProgress(null);
    } else {
      // All added — go to properties list
      router.push("/properties");
    }
  };

  const selectedCount = selected.size;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Add properties</h1>
      <p className="text-muted-foreground mb-6">
        {googleEmail
          ? `Connected as ${googleEmail}. Pick one or more sites to track.`
          : "Pick verified Search Console sites to track."}
      </p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No verified properties</CardTitle>
            <CardDescription>
              We didn&apos;t find any verified Search Console properties for this
              Google account. Verify a site in Search Console first, then come
              back.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter sites…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer px-3 h-9 rounded-md border border-border hover:bg-muted/40 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                disabled={selectableUrls.length === 0}
              />
              Select all {filter ? "shown" : ""}
            </label>
            <Button
              onClick={addSelected}
              disabled={selectedCount === 0 || bulkAdding}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {bulkAdding
                ? `Adding… ${bulkProgress?.done ?? 0}/${bulkProgress?.total ?? 0}`
                : selectedCount > 0
                  ? `Add ${selectedCount} selected`
                  : "Add selected"}
            </Button>
          </div>

          {/* List */}
          <div className="border rounded-md divide-y divide-border bg-card">
            {filteredSites.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No sites match that filter.
              </div>
            ) : (
              filteredSites.map((site) => {
                const isSelected = selected.has(site.siteUrl);
                const disabled =
                  site.added || bulkAdding || addingOne !== null;
                return (
                  <label
                    key={site.siteUrl}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer ${
                      site.added ? "opacity-60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => toggle(site.siteUrl)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-all text-sm">
                        {site.siteUrl}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {site.permissionLevel}
                        {site.added && " · already added"}
                      </div>
                    </div>
                    {site.added ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          addOne(site.siteUrl);
                        }}
                        disabled={bulkAdding || addingOne !== null}
                        className="gap-1.5"
                      >
                        {addingOne === site.siteUrl ? "Adding…" : "Add only"}
                      </Button>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
