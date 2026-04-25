"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, AlertCircle, LineChart, Target, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) { router.push("/"); router.refresh(); }
      else setError((await res.json()).error || "Invalid credentials");
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">
      {/* ── Left — Brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-[oklch(0.10_0.02_264)] p-12">
        {/* Glow blobs */}
        <div className="absolute top-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/25 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%]  h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px] pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, oklch(1 0 0 / 50%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <BarChart3 className="h-4.5 w-4.5 h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-[15px] leading-none">SEO Audit Pro</p>
            <p className="text-[10px] text-white/35 mt-0.5">Enterprise Platform</p>
          </div>
        </div>

        {/* Copy */}
        <div className="relative space-y-8 max-w-md">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Your SEO command<br />centre is waiting.
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed">
              Real-time Google Search Console data, AI content generation, technical audits, and team collaboration — all free.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: LineChart, label: "GSC Analytics" },
              { icon: Sparkles,  label: "AI Content" },
              { icon: Target,    label: "Quick Wins" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-4 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-primary mb-2.5" />
                <p className="text-white/60 text-[12px] font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-[11px]">Built by KuyaMecky · Open Source</p>
      </div>

      {/* ── Right — Form ── */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[360px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-[15px]">SEO Audit Pro</span>
          </div>

          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-[13px] mt-1.5">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-[13px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Email</Label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-[13px] rounded-xl border-border/80 focus-visible:ring-primary/30" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-[13px] rounded-xl border-border/80 focus-visible:ring-primary/30" required />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
