"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Check, AlertCircle } from "lucide-react";

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
  const [adding, setAdding] = useState<string | null>(null);

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

  const addProperty = async (siteUrl: string) => {
    setAdding(siteUrl);
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
        setAdding(null);
      }
    } catch (err) {
      setError("Failed to add property");
      setAdding(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Add a property</h1>
      <p className="text-gray-600 mb-6">
        {googleEmail
          ? `Connected as ${googleEmail}. Pick a site to track.`
          : "Pick a verified Search Console site to track."}
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
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No verified properties</CardTitle>
            <CardDescription>
              We didn&apos;t find any verified Search Console properties for this Google
              account. Verify a site in Search Console first, then come back.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <Card key={site.siteUrl}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium break-all">{site.siteUrl}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {site.permissionLevel}
                  </div>
                </div>
                {site.added ? (
                  <Button variant="outline" disabled className="gap-2">
                    <Check className="h-4 w-4" />
                    Added
                  </Button>
                ) : (
                  <Button
                    onClick={() => addProperty(site.siteUrl)}
                    disabled={adding === site.siteUrl}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {adding === site.siteUrl ? "Adding…" : "Add"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
