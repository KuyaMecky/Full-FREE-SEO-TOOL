"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, AlertCircle } from "lucide-react";
import { CrawlProgressLive } from "@/app/components/crawl-progress-live";

interface GCSProperty {
  id: string;
  siteUrl: string;
  permissionLevel: string;
}

const BUSINESS_TYPES = [
  "E-commerce",
  "SaaS",
  "Blog/Media",
  "Local Business",
  "Portfolio",
  "Corporate",
  "Non-profit",
  "Education",
  "Healthcare",
  "Real Estate",
  "Other",
];

const GOAL_OPTIONS = [
  "Increase organic traffic",
  "Improve search rankings",
  "Fix technical issues",
  "Improve page speed",
  "Better mobile experience",
  "Content optimization",
  "Increase conversions",
  "Compete with rivals",
  "Recover from penalty",
  "Launch/redesign prep",
];

export function AuditInputForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditId, setAuditId] = useState<string | null>(null);
  const [gcsProperties, setGcsProperties] = useState<GCSProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  const [domain, setDomain] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [country, setCountry] = useState("US");
  const [language, setLanguage] = useState("en");
  const [businessType, setBusinessType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [priorityPages, setPriorityPages] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [cmsStack, setCmsStack] = useState("");
  const [maxPages, setMaxPages] = useState(50);

  useEffect(() => {
    const fetchGcsProperties = async () => {
      try {
        const res = await fetch("/api/gcs-properties");
        if (res.ok) {
          const data = await res.json();
          setGcsProperties(data);
          if (data.length > 0) {
            setSelectedPropertyId(data[0].id);
            setDomain(data[0].siteUrl);
          }
        }
      } catch (err) {
        console.error("Failed to load GCS properties:", err);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchGcsProperties();
  }, []);

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const selected = gcsProperties.find((p) => p.id === propertyId);
    if (selected) {
      setDomain(selected.siteUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!domain.trim()) {
      setError("Please select a domain to audit or connect to Google Search Console");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          country,
          language,
          businessType,
          goals,
          priorityPages: priorityPages
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean),
          competitors: competitors
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean),
          cmsStack,
          maxPages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create audit");
      }

      const data = await res.json();
      setAuditId(data.id);

      // Start the crawl
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: data.id }),
      });

      if (!crawlRes.ok) {
        const crawlError = await crawlRes.json();
        throw new Error(crawlError.error || "Failed to start crawl");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Target Website</CardTitle>
          <CardDescription>
            Select a site connected to Google Search Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {propertiesLoading ? (
            <div className="text-sm text-gray-500">Loading your sites...</div>
          ) : gcsProperties.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">No sites connected</p>
                <p className="mb-2">
                  You need to connect your site to Google Search Console first.
                </p>
                <a
                  href="/properties/connect"
                  className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Connect to Google Search Console
                </a>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="property">Select Your Site *</Label>
              <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gcsProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.siteUrl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="domain">Domain *</Label>
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1"
              disabled={gcsProperties.length > 0}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Target Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="NL">Netherlands</SelectItem>
                  <SelectItem value="BR">Brazil</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="maxPages">Max Pages to Crawl</Label>
            <Input
              id="maxPages"
              type="number"
              min={1}
              max={200}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="mt-1 w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Context</CardTitle>
          <CardDescription>
            Help us tailor the audit to your specific needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="businessType">Business Type</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Goals (select all that apply)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GOAL_OPTIONS.map((goal) => (
                <Badge
                  key={goal}
                  variant={goals.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleGoal(goal)}
                >
                  {goals.includes(goal) && <X className="h-3 w-3 mr-1" />}
                  {!goals.includes(goal) && <Plus className="h-3 w-3 mr-1" />}
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="cmsStack">CMS / Tech Stack</Label>
            <Input
              id="cmsStack"
              placeholder="e.g., WordPress, Shopify, React, etc."
              value={cmsStack}
              onChange={(e) => setCmsStack(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Info (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="priorityPages">Priority Pages (one per line)</Label>
            <Textarea
              id="priorityPages"
              placeholder={"/\n/products\n/about\n/contact"}
              value={priorityPages}
              onChange={(e) => setPriorityPages(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="competitors">Competitor Domains (one per line)</Label>
            <Textarea
              id="competitors"
              placeholder={"competitor1.com\ncompetitor2.com"}
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {auditId && (
        <CrawlProgressLive
          auditId={auditId}
          onComplete={(status) => {
            if (status === 'complete') {
              const competitorsList = competitors
                .split("\n")
                .map((c) => c.trim())
                .filter(Boolean);
              const params = new URLSearchParams({
                auditId,
                domain: domain.trim(),
                competitors: JSON.stringify(competitorsList),
              });
              router.push(`/seo-intelligence?${params.toString()}`);
            }
          }}
        />
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Starting Audit..." : "Start SEO Audit"}
      </Button>
    </form>
  );
}
