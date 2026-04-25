"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) { router.push("/"); router.refresh(); }
      else setError((await res.json()).error || "Invalid credentials");
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand */}
      <div className="hidden lg:flex flex-col justify-between bg-[oklch(0.09_0.008_264)] p-12 relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-[14px] text-white">SEO Audit Pro</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="font-display text-3xl font-bold text-white leading-snug">
              "Finally an SEO tool that doesn't charge per keyword."
            </p>
            <p className="text-white/40 text-[13px]">Built on Google's free APIs</p>
          </blockquote>

          {/* Mini metric strip */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { n: "9",   l: "analyzers" },
              { n: "4",   l: "AI models" },
              { n: "∞",   l: "sites" },
            ].map(s => (
              <div key={s.l} className="border border-white/10 rounded p-3">
                <p className="font-display font-bold text-xl text-white stat-num">{s.n}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-[11px] relative z-10">
          By <a href="https://github.com/KuyaMecky" className="hover:text-white/40 transition-colors">KuyaMecky</a>
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[340px]">
          <div className="lg:hidden mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <BarChart3 className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-[14px]">SEO Audit Pro</span>
            </Link>
          </div>

          <h1 className="font-display font-bold text-[26px] mb-1">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground mb-8">Sign in to your workspace</p>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded border border-destructive/30 bg-destructive/8 text-[13px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Email</Label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}
                className="h-10 text-[13px]" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="h-10 text-[13px]" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-10 rounded bg-primary text-primary-foreground font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-2 disabled:opacity-60">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-[13px] text-muted-foreground text-center mt-8">
            No account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
