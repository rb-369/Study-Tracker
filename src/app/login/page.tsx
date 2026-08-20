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
    <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 max-w-lg mx-auto text-left animate-slide-up">
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
    <div className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-zinc-950 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-zinc-100">StudyFlow</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              AI
            </span>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
        >
          Instant Demo Mode
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 sm:py-14 flex flex-col items-center text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>The First AI Study Tracker with In-Session Mind Pings</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-[1.15]">
          Stop confusing raw clock time with <span className="text-emerald-400">real focused study.</span>
        </h1>

        {/* Subtext */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-lg mt-4 leading-relaxed">
          Log in-between stray thoughts in 1-tap, isolate net deep work, and receive automated AI debriefs.
        </p>

        {/* Primary Auth Gate CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
          {/* Sign in with Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm"
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
            className="w-full py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <span>Try Guest Demo</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-12 w-full text-left">
          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="text-xs font-bold text-zinc-100 mb-0.5">In-Session Mind Pings</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Capture wandering thoughts in 1-tap. Automatically subtract context-switch minutes to calculate true Focus Ratio.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2.5">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-xs font-bold text-zinc-100 mb-0.5">Post-Session AI Debrief</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Immediate feedback on your flow state, focus score out of 100, and actionable habit recommendations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-zinc-100 mb-0.5">Circadian Focus Trends</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Spot your peak cognitive hours, top distraction triggers, and weekly syllabus progress.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-800/80 py-5 text-center text-[11px] text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <span>StudyFlow &bull; Deep Work Capacity Engine</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Private & Encrypted with Supabase RLS</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
