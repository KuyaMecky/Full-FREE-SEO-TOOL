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
