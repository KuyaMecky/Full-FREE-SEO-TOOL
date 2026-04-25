"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, AlertCircle, CheckCircle, Shield, Sparkles, Users } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
      } else setError((await res.json()).error || "Registration failed");
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-500"][strength];
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];

  return (
    <div className="min-h-screen grid lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr]">
      {/* ── Left — Form ── */}
      <div className="flex items-center justify-center px-6 py-12 bg-background order-2 lg:order-1">
        <div className="w-full max-w-[360px] space-y-8">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-[15px]">SEO Audit Pro</span>
          </div>

          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-[13px] mt-1.5">Free forever · No credit card needed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-[13px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-[13px] text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />Account created! Redirecting…
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)}
                className="h-11 text-[13px] rounded-xl border-border/80 focus-visible:ring-primary/30" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Email</Label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-[13px] rounded-xl border-border/80 focus-visible:ring-primary/30" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-[13px] rounded-xl border-border/80 focus-visible:ring-primary/30" required />
              {password.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strength >= s ? strengthColor : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{strengthLabel} password</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className={`h-11 text-[13px] rounded-xl border-border/80 focus-visible:ring-primary/30 ${confirm && confirm !== password ? "border-destructive/50" : ""}`} required />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── Right — Brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-[oklch(0.10_0.02_264)] p-12 order-1 lg:order-2">
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%]  h-[400px] w-[400px] rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, oklch(1 0 0 / 50%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <BarChart3 className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-[15px] leading-none">SEO Audit Pro</p>
            <p className="text-[10px] text-white/35 mt-0.5">Enterprise Platform</p>
          </div>
        </div>

        <div className="relative space-y-8 max-w-md">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Start free.<br />Scale when ready.
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed">
              Everything you need to rank higher — crawling, auditing, AI writing, and team tools. Forever free.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: Sparkles, text: "AI article generation with GSC signals" },
              { icon: Shield,   text: "9-analyzer technical audits" },
              { icon: Users,    text: "Team collaboration & property assignments" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-white/60 text-[13px]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-[11px]">Built by KuyaMecky · Open Source</p>
      </div>
    </div>
  );
}
