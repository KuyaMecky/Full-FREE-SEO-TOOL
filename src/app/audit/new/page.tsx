import { AuditInputForm } from "@/components/audit/input-form";

export default function NewAuditPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">New SEO Audit</h1>
        <p className="text-muted-foreground mt-2">
          Configure your audit settings to get started. Our crawler will analyze your website
          and provide actionable insights.
        </p>
      </div>
      <AuditInputForm />
    </div>
  );
}
