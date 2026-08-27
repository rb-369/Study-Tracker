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
  X,
  CheckCircle2,
  TrendingUp,
  Database,
  Globe,
  Flame,
  Layers,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { HeroLiveSimulator } from "@/components/landing/HeroLiveSimulator";
import Link from "next/link";

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
    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 max-w-lg mx-auto text-left animate-slide-up">
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

export default function LandingAndLoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsDemoUser, isAuthenticated } = useStudyStore();
  
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      if (authMode === "signin") {
        await signInWithEmail(email, password);
        router.push("/");
      } else {
        await signUpWithEmail(email, password, fullName);
        setAuthSuccessMsg("Account created! Check your email to confirm or log in directly.");
      }
    } catch (err: any) {
      console.warn("Email auth error:", err);
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn("Google Auth error:", err);
      setAuthError(err.message || "Unable to initiate Google OAuth. Check your Supabase configuration.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    signInAsDemoUser();
    router.push("/");
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#0d0d11]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/25 flex items-center justify-center bg-zinc-900 shadow-sm">
              <img
                src="/Study_flow_logo.png"
                alt="StudyFlow Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-100">StudyFlow</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                AI Deep Work
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDemoLogin}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              Demo Mode
            </button>
            <a
              href="#auth-section"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
        {/* Section 1: Asymmetric Split Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Autonomous Cognitive Focus Engine</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Stop confusing raw clock time with <span className="text-emerald-400">real deep focus.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed">
              Isolate net focus from mental drift in 1-tap, guided by autonomous AI cognitive mentorship.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#auth-section"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Start Focus Session</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={handleDemoLogin}
                className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Instant Guest Demo</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Social Proof Strip */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-emerald-600 border border-[#09090b] flex items-center justify-center text-[10px] font-bold text-zinc-950">A</div>
                <div className="w-6 h-6 rounded-full bg-teal-600 border border-[#09090b] flex items-center justify-center text-[10px] font-bold text-zinc-950">R</div>
                <div className="w-6 h-6 rounded-full bg-indigo-600 border border-[#09090b] flex items-center justify-center text-[10px] font-bold text-white">S</div>
              </div>
              <span>Calibrated for competitive exam aspirants & engineers</span>
            </div>
          </div>

          {/* Right Column: Live Interactive Simulator Card */}
          <div className="lg:col-span-6">
            <HeroLiveSimulator />
          </div>
        </section>

        {/* Section 2: The Core Problem — Clock Time Illusion vs Net Focus Reality */}
        <section className="space-y-6">
          <div className="text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              The Illusion of &ldquo;Studying 6 Hours&rdquo;
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Standard timers measure the time you spent sitting, not the time your brain was in flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* The Traditional Illusion */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-rose-500/20 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                  Traditional Stopwatch
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300">
                  Gross Illusion
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-200">
                4h 00m <span className="text-xs font-sans text-zinc-500">Logged on Clock</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-4">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>14 phone and tab distractions during the block</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>Working memory constantly fragmented by unlogged stray thoughts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span><strong>Actual neural retention:</strong> Less than 48%</span>
                </li>
              </ul>
            </div>

            {/* The StudyFlow Reality */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-emerald-500/30 space-y-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>StudyFlow Engine</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                  Net Focus Purity
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300">
                2h 45m <span className="text-xs font-sans text-emerald-500">Pure Flow Time (92% Score)</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/80 pt-4">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span>In-session stray thoughts offloaded in 1-tap without breaking focus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  <span>Exact Net Focus seconds isolated from distraction context switches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span><strong>Automated AI Debrief:</strong> Cognitive recovery tips & circadian tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Asymmetric Bento Architecture */}
        <section className="space-y-6">
          <div className="text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              The Three Pillars of Flow
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Designed around evidence-based cognitive neuroscience, ultradian rhythms, and autonomous AI agents.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
            {/* Bento Card 1: 1-Tap Mind Ping Inversion (Span 7) */}
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl space-y-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                  1-Tap Mind Ping Inversion Bar
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  When a wandering thought or dopamine urge strikes, don&apos;t battle it with brute willpower. Tap once to offload it from working memory, deduct the exact distraction time, and protect your flow.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-300">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">📱 Phone (-3m)</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">☕ Hunger (-2m)</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">💡 Stray Idea (-2m)</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">⚡ Custom Pins</span>
              </div>
            </div>

            {/* Bento Card 2: LangGraph Autonomous AI Mentor (Span 5) */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl space-y-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Brain className="w-4 h-4" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                  LangGraph AI Mentor Cockpit
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Your personalized cognitive coach. Queries your past session memory via Qdrant RAG and searches real-time active recall science via Tavily.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-400" /> Qdrant RAG
                </span>
                <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-teal-400" /> Tavily Search
                </span>
              </div>
            </div>

            {/* Bento Card 3: Circadian Analytics & Exam Goals (Span 12) */}
            <div className="lg:col-span-12 p-6 sm:p-7 rounded-2xl bg-[#121216] border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                      Circadian Heatmaps & Exam Sprint Countdown
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Discover your peak cognitive performance hours and link daily deep work blocks directly to exam milestones.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-mono">Telemetry</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">Focus Score /100</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-mono">Heatmap</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">Peak Hour Detection</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-mono">Security</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">Supabase Cloud Sync</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-mono">Modality</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">Stopwatch & Pomodoro</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Interactive Auth Section */}
        <section id="auth-section" className="scroll-mt-20 flex flex-col items-center text-center space-y-6">
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Step Into Deep Work
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Create your account in seconds or test instantly in demo mode.
            </p>
          </div>

          {/* Auth Card Box */}
          <div className="w-full max-w-md bg-[#121216] border border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl text-left">
            {/* Tabs: Sign In / Create Account */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === "signin"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === "signup"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 font-mono">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Marie Curie"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 font-mono">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@domain.com"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 font-mono">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : authMode === "signin" ? (
                  <span>Sign In with Email</span>
                ) : (
                  <span>Create Free Account</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-zinc-800" />
              <span className="bg-[#121216] px-3 text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                or
              </span>
            </div>

            {/* Google & Demo Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
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
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <span>Try Instant Guest Demo</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            {authSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                {authSuccessMsg}
              </div>
            )}

            {authError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                {authError}
              </div>
            )}
          </div>

          <Suspense fallback={null}>
            <AuthErrorBanner onDismiss={() => router.replace("/login")} />
          </Suspense>
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-[11px] text-zinc-500 bg-[#0c0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>StudyFlow • Deep Work Capacity Engine</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/mentor" className="hover:text-emerald-400 transition-colors">AI Mentor</Link>
            <Link href="/goals" className="hover:text-emerald-400 transition-colors">Exam Goals</Link>
            <Link href="/analytics" className="hover:text-emerald-400 transition-colors">Analytics</Link>
            <span className="flex items-center gap-1 text-zinc-500">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Encrypted with Supabase RLS</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
