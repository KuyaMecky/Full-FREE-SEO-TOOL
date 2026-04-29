import { Suspense } from "react";
import IntelligenceDashboard from "./dashboard";

export default function SEOIntelligencePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <IntelligenceDashboard />
    </Suspense>
  );
}
