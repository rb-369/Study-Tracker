"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Clock, 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  Lock,
  AlertCircle,
  X
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";

function AuthErrorBanner({ onDismiss }: { onDismiss: () => void }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (!error && !errorDescription) return null;

  const displayMessage = errorDescription || (
    error === "auth_failed" 
      ? "Google authentication failed. Please verify your Supabase Redirect URLs and Google OAuth configuration."
      : error === "no_auth_code"
      ? "No authorization code returned from Google."
      : error 
      ? decodeURIComponent(error)
      : "An authentication error occurred. Please try again."
  );

  return (
    <div className="mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 max-w-lg mx-auto text-left animate-slide-up">
      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-rose-200">Authentication Notice</p>
        <p className="text-[11px] mt-0.5 text-rose-300/90 leading-relaxed">{displayMessage}</p>
      </div>
      <button onClick={onDismiss} className="text-rose-400 hover:text-white p-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInAsDemoUser, isAuthenticated } = useStudyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn("Direct Supabase Google Auth error:", err);
      setAuthError(err.message || "Unable to initiate Google OAuth. Check your Supabase configuration.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    signInAsDemoUser();
    router.push("/");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col justify-between selection:bg-focus selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-focus/15 via-deepwork/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-focus/15 border border-focus/30 flex items-center justify-center text-focus shadow-lg shadow-focus/10">
            <Sparkles className="w-5 h-5 text-focus" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">StudyFlow</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-focus/10 text-focus border border-focus/25 font-semibold">
                AI
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-surface-elevated/80 border border-border text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          Instant Demo Mode
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 sm:py-12 flex flex-col items-center text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated/90 border border-focus/30 text-focus text-xs font-medium mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-focus animate-pulse" />
          <span>The First AI Study Tracker with In-Session Mind Pings</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.1]">
          Stop confusing raw clock time with <span className="text-transparent bg-clip-text bg-gradient-to-r from-focus via-emerald-300 to-focus-light">real focused study.</span>
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mt-4 leading-relaxed">
          Log in-between stray thoughts in 1-tap, isolate net deep work, and receive automated AI debriefs.
        </p>

        {/* Primary Auth Gate CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md">
          {/* Sign in with Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-xl shadow-white/10 active:scale-[0.98] flex items-center justify-center gap-3 border border-slate-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Instant Demo CTA */}
          <button
            onClick={handleDemoLogin}
            className="w-full py-3.5 px-6 rounded-2xl bg-surface-elevated hover:bg-slate-800 border border-border text-slate-200 font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Try Guest Demo</span>
            <ArrowRight className="w-4 h-4 text-focus" />
          </button>
        </div>

        <Suspense fallback={null}>
          <AuthErrorBanner onDismiss={() => router.replace("/login")} />
        </Suspense>

        {authError && (
          <p className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg max-w-md">
            {authError}
          </p>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full text-left">
          <div className="p-5 rounded-2xl glass-card border border-border">
            <div className="w-9 h-9 rounded-xl bg-focus/15 border border-focus/30 flex items-center justify-center text-focus mb-3">
              <Zap className="w-4 h-4 text-focus" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">In-Session Mind Pings</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capture wandering thoughts in 1-tap. Automatically subtract context-switch minutes to compute true Focus Ratio.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-border">
            <div className="w-9 h-9 rounded-xl bg-deepwork/15 border border-deepwork/30 flex items-center justify-center text-deepwork-light mb-3">
              <Brain className="w-4 h-4 text-deepwork-light" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Post-Session AI Debrief</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Immediate feedback on your flow state, focus score out of 100, and actionable focus habit recommendations.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-border">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Circadian Focus Trends</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spot your peak cognitive hours, top distraction triggers, and weekly syllabus progress.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <span>StudyFlow — Deep Work Capacity Engine</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-focus" />
            <span>Private & Encrypted with Supabase RLS</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
