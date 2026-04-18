"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, ArrowRight, Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure integrations and API keys.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect external services and AI providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/settings/integrations/google">
            <div className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/40 cursor-pointer">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-blue-600" />
                  Google Search Console
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Impressions, clicks, keyword rankings, per-page metrics.
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/70" />
            </div>
          </Link>
          <Link href="/settings/integrations/ai">
            <div className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/40 cursor-pointer">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI Provider
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Choose Anthropic Claude, OpenAI, or Google Gemini for
                  audit reports and GSC suggestions.
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/70" />
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>SEO Audit Pro</strong> — Technical SEO audits plus Google
              Search Console rankings and AI-generated suggestions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
