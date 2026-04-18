"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function ConnectGoogleButton({
  label = "Connect Google Search Console",
}: {
  label?: string;
}) {
  return (
    <a href="/api/google/authorize">
      <Button size="lg" className="gap-2">
        <LogIn className="h-4 w-4" />
        {label}
      </Button>
    </a>
  );
}
