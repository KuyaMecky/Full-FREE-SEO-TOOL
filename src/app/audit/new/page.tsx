"use client";

import { Search } from "lucide-react";
import { AuditInputForm } from "@/components/audit/input-form";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { APIStatusIndicator } from "@/app/components/api-status-indicator";
import { GUIDES } from "@/lib/guides";

export default function NewAuditPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        icon={Search}
        title="New SEO Audit"
        accent="primary"
        description="Configure your audit settings. The crawler will analyze your website and AI will produce a full report."
      />
      <APIStatusIndicator variant="compact" />
      <HelpBanner guideKey="auditNew" guide={GUIDES.auditNew} />
      <AuditInputForm />
    </div>
  );
}
