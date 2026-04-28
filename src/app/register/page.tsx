"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
      } else setError((await res.json()).error || "Registration failed");
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[340px]">
          <div className="mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <BarChart3 className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-[14px]">SEO Audit Pro</span>
            </Link>
          </div>

          <h1 className="font-display font-bold text-[26px] mb-1">Create account</h1>
          <p className="text-[13px] text-muted-foreground mb-8">Free forever. No credit card needed.</p>

          <div className="space-y-3 mb-6">
            <a href="/api/auth/github" className="w-full h-10 rounded border border-border bg-muted/50 text-foreground font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-muted transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg> Sign up with GitHub
            </a>
            <a href="/api/auth/google" className="w-full h-10 rounded border border-border bg-muted/50 text-foreground font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-muted transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg> Sign up with Google
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="px-2 bg-background text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded border border-destructive/30 bg-destructive/8 text-[13px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {done && (
              <div className="flex items-center gap-2 p-3 rounded border border-primary/30 bg-primary/8 text-[13px] text-primary">
                <CheckCircle className="h-4 w-4 shrink-0" /> Account created! Redirecting…
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Name <span className="font-normal normal-case tracking-normal">(optional)</span>
              </Label>
              <Input placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} className="h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Email</Label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="h-10 text-[13px]" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-10 text-[13px]" required />
              {password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[1,2,3].map(s => (
                    <div key={s} className={`h-0.5 flex-1 rounded-full transition-colors ${strength >= s ? ["","bg-red-500","bg-amber-400","bg-primary"][strength] : "bg-border"}`} />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Confirm password</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className={`h-10 text-[13px] ${confirm && confirm !== password ? "border-destructive/50 focus-visible:ring-destructive/20" : ""}`} required />
            </div>

            <button type="submit" disabled={loading || done}
              className="w-full h-10 rounded bg-primary text-primary-foreground font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-2 disabled:opacity-60">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="text-[13px] text-muted-foreground text-center mt-8">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right: brand */}
      <div className="hidden lg:flex flex-col justify-between bg-[oklch(0.09_0.008_264)] p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-[14px] text-white">SEO Audit Pro</span>
        </Link>

        <div className="space-y-8">
          <h2 className="font-display font-bold text-3xl text-white leading-snug">
            All the SEO tools.<br />None of the fees.
          </h2>
          <div className="space-y-3">
            {[
              "Real-time Google Search Console data",
              "AI content generation with GSC signals",
              "Technical audits with 9 analyzers",
              "Team collaboration & task assignments",
              "WordPress publishing with Yoast support",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-white/60 text-[13px]">
                <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-[11px]">Open source · By KuyaMecky</p>
      </div>
    </div>
  );
}
