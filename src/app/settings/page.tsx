"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  Sparkles, 
  Database, 
  LogOut, 
  Check, 
  ShieldCheck, 
  Copy,
  ExternalLink,
  Target
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionStartModal } from "@/components/session/SessionStartModal";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut, updateUserProfile } = useStudyStore();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  const [dailyTargetMins, setDailyTargetMins] = useState<number | string>(user?.target_daily_minutes || 180);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  React.useEffect(() => {
    if (user?.target_daily_minutes) {
      setDailyTargetMins(user.target_daily_minutes);
    }
  }, [user?.target_daily_minutes]);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30 flex items-center justify-center bg-zinc-900 animate-pulse shadow-lg">
            <img
              src="/Study_flow_logo.png"
              alt="StudyFlow Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs font-mono text-zinc-500">Loading Settings...</p>
        </div>
      </div>
    );
  }

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const parsedMins = typeof dailyTargetMins === "number" ? dailyTargetMins : parseInt(dailyTargetMins, 10);
      const finalMins = isNaN(parsedMins) || parsedMins < 10 ? 180 : parsedMins;
      await updateUserProfile({ target_daily_minutes: finalMins });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const copySqlNotice = () => {
    navigator.clipboard.writeText(`-- Run schema.sql from the repository supabase/schema.sql in your Supabase SQL Editor.`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar onOpenNewSession={() => setIsStartModalOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar onOpenNewSession={() => setIsStartModalOpen(true)} />

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
          {/* Header */}
          <div className="pb-4 border-b border-border/80">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Settings & Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your focus targets, AI provider preferences, and Supabase cloud sync
            </p>
          </div>

          {/* 1. Profile Details Card */}
          <div className="p-6 rounded-2xl glass-card border border-border space-y-5">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-focus" />
              <span>Learner Profile</span>
            </h3>

            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-focus/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
              )}

              <div>
                <h4 className="text-lg font-bold text-white">{user?.full_name || "Learner"}</h4>
                <p className="text-xs text-slate-400 font-mono">{user?.email || "Local Demo User"}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{user?.id.startsWith("demo-") ? "Guest Demo Mode" : "Authenticated with Google"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Daily Goal Preference */}
          <div className="p-6 rounded-2xl glass-card border border-border space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-4 h-4 text-focus" />
              <span>Daily Deep Work Target</span>
            </h3>

            <form onSubmit={handleSaveGoal} className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1440"
                  step="5"
                  value={dailyTargetMins}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setDailyTargetMins("");
                    } else {
                      const num = parseInt(val, 10);
                      setDailyTargetMins(isNaN(num) ? "" : num);
                    }
                  }}
                  onBlur={() => {
                    if (dailyTargetMins === "" || Number(dailyTargetMins) < 10) {
                      setDailyTargetMins(180);
                    }
                  }}
                  className="w-36 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-zinc-500">mins</span>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-focus hover:bg-focus-light text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Update Goal</span>
                )}
              </button>
            </form>
          </div>

          {/* 3. AI Intelligence Engine Status */}
          <div className="p-6 rounded-2xl glass-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-deepwork-light" />
                <span>AI Cognitive Coaching Engine</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-deepwork/15 text-deepwork-light border border-deepwork/30">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              StudyFlow uses a multi-tier AI engine. It queries <strong>OpenRouter</strong> (Gemini 2.0 / Claude 3.5 Haiku) with fallback to <strong>Google Gemini API</strong>, and an offline deterministic heuristic synthesizer for instant post-session debriefs and weekly reviews.
            </p>

            <div className="p-4 rounded-xl bg-surface-elevated/60 border border-border/80 text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Primary Provider:</span>
                <span className="text-focus font-bold">OpenRouter API</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Fallback Provider:</span>
                <span className="text-deepwork-light font-bold">Google Gemini API</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Offline Engine:</span>
                <span className="text-amber-400 font-bold">Deterministic Focus Heuristics</span>
              </div>
            </div>
          </div>

          {/* 4. Supabase Database Cloud Sync */}
          <div className="p-6 rounded-2xl glass-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Supabase PostgreSQL Cloud Storage</span>
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              To connect your own Supabase project, supply <code className="text-slate-200">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-slate-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="text-focus">.env.local</code> and run the migrations script in <code className="text-slate-200">supabase/schema.sql</code>.
            </p>

            <button
              onClick={copySqlNotice}
              className="px-4 py-2 rounded-xl bg-surface-elevated border border-border text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-focus" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? "Copied notice!" : "Copy Schema Info"}</span>
            </button>
          </div>

          {/* 5. Sign Out Action */}
          <div className="pt-4 border-t border-border/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Sign Out</h4>
              <p className="text-xs text-slate-400">Exit your StudyFlow session on this device</p>
            </div>

            <button
              onClick={() => signOut()}
              className="px-5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </main>
      </div>

      <MobileNav />

      <SessionStartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />
    </div>
  );
}
