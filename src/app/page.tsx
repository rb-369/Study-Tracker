"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Play, 
  Flame, 
  Zap, 
  Brain, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  ChevronRight, 
  Calendar,
  Layers,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiveSessionTimer } from "@/components/session/LiveSessionTimer";
import { SessionStartModal } from "@/components/session/SessionStartModal";
import { SessionEndDebriefModal } from "@/components/session/SessionEndDebriefModal";
import { computeAnalyticsSummary } from "@/lib/analytics/metrics";
import { formatMinutesToDisplay, CATEGORY_METADATA } from "@/lib/utils";
import { StudySession } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, activeSession, sessions, subjects } = useStudyStore();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [inspectedSession, setInspectedSession] = useState<StudySession | null>(null);

  // Auth gate check
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-focus/15 border border-focus/30 flex items-center justify-center text-focus animate-spin">
            <Sparkles className="w-5 h-5 text-focus" />
          </div>
          <p className="text-xs font-mono text-slate-400">Loading your StudyFlow space...</p>
        </div>
      </div>
    );
  }

  const summary = computeAnalyticsSummary(sessions);

  // Calculate today's net minutes
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter(
    (s) => s.status === "completed" && s.start_time.startsWith(todayStr)
  );
  const todayNetMinutes = todaySessions.reduce(
    (acc, s) => acc + Math.round(s.net_focus_seconds / 60),
    0
  );
  const dailyTargetMinutes = user?.target_daily_minutes || 180;
  const todayProgressPercent = Math.min(100, Math.round((todayNetMinutes / dailyTargetMinutes) * 100));

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <Sidebar onOpenNewSession={() => setIsStartModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar onOpenNewSession={() => setIsStartModalOpen(true)} />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
          {/* Welcome Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>Welcome back, {user?.full_name?.split(" ")[0] || "Learner"}</span>
                <span className="text-xl">✨</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ready to track deep work and isolate your real net focus time?
              </p>
            </div>

            {!activeSession && (
              <button
                onClick={() => setIsStartModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-focus to-focus-dark hover:opacity-95 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-xl shadow-focus/25 flex items-center gap-2 active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start New Focus Block</span>
              </button>
            )}
          </div>

          {/* ACTIVE STUDY SESSION (Hero Area if running) */}
          {activeSession ? (
            <LiveSessionTimer onEndSessionClick={() => setIsDebriefModalOpen(true)} />
          ) : (
            /* DAILY PROGRESS HERO CARD (If no session active) */
            <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-border/90 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-2 text-xs font-semibold text-focus uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-focus" />
                    <span>Today&apos;s Focus Target</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {todayNetMinutes > 0
                      ? `${formatMinutesToDisplay(todayNetMinutes)} of pure deep work logged today`
                      : "No study sessions recorded yet today"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Daily Goal: {formatMinutesToDisplay(dailyTargetMinutes)} ({todayProgressPercent}% reached)
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Progress Bar & Quick Start */}
                  <div className="flex-1 md:w-48 space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-surface-subtle overflow-hidden border border-border/80">
                      <div
                        className="h-full bg-focus rounded-full transition-all duration-500"
                        style={{ width: `${todayProgressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0m</span>
                      <span>{dailyTargetMinutes}m target</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsStartModalOpen(true)}
                    className="p-3.5 rounded-2xl bg-focus hover:bg-focus-light text-slate-950 font-bold transition-all shadow-lg shadow-focus/20 active:scale-[0.98] flex items-center justify-center flex-shrink-0"
                  >
                    <Play className="w-5 h-5 fill-slate-950" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK SNAPSHOT METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl glass-card border border-border">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Total Net Focus</span>
              <span className="text-xl font-bold font-mono text-focus">
                {formatMinutesToDisplay(summary.totalNetMinutes)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                {(summary.overallFocusRatio * 100).toFixed(0)}% focus ratio
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-border">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Mind Pings</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {summary.totalThoughtsLogged}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                stray thoughts audited
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-border">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Max Deep Streak</span>
              <span className="text-xl font-bold font-mono text-deepwork-light">
                {formatMinutesToDisplay(summary.longestDeepWorkStreakMinutes)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                uninterrupted stretch
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-border">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Completed Blocks</span>
              <span className="text-xl font-bold font-mono text-white">
                {summary.completedSessionsCount}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                {summary.currentStreakDays} day streak
              </span>
            </div>
          </div>

          {/* RECENT STUDY SESSIONS & MIND PINGS LOG */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Recent Study Sessions & Mind Ping History
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect gross vs. net time, focus scores, and logged interruptions
                </p>
              </div>

              <button
                onClick={() => router.push("/analytics")}
                className="text-xs font-semibold text-focus hover:underline flex items-center gap-1"
              >
                <span>Full Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card border border-dashed border-border text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-300 font-medium">No study sessions logged yet.</p>
                <button
                  onClick={() => setIsStartModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-focus text-slate-950 text-xs font-bold"
                >
                  Start Your First Session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((sess) => {
                  const grossMins = Math.round(sess.gross_duration_seconds / 60);
                  const netMins = Math.round(sess.net_focus_seconds / 60);
                  const lostMins = Math.max(0, grossMins - netMins);
                  const dateFormatted = new Date(sess.start_time).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => setInspectedSession(sess)}
                      className="p-4 sm:p-5 rounded-2xl glass-card border border-border hover:border-slate-700 cursor-pointer transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sess.subject?.color || "#10b981" }}
                          />
                          <span className="text-xs font-semibold text-slate-400">
                            {sess.subject?.name || "General Subject"}
                          </span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-xs text-slate-500 font-mono">{dateFormatted}</span>
                        </div>

                        {/* Focus Score Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-focus/15 text-focus border border-focus/30">
                            Score: {sess.focus_score}/100
                          </span>
                        </div>
                      </div>

                      {/* Topic & Net/Gross Split */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {sess.topic}
                        </h4>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-focus font-bold">
                            {netMins}m net focus
                          </span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">
                            {grossMins}m clock
                          </span>
                          {lostMins > 0 && (
                            <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[11px]">
                              -{lostMins}m pings
                            </span>
                          )}
                        </div>
                      </div>

                      {/* In-Session Mind Ping Chips Preview */}
                      {sess.thoughts && sess.thoughts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-500 font-medium mr-1">
                            Pings:
                          </span>
                          {sess.thoughts.map((t, idx) => {
                            const meta = CATEGORY_METADATA[t.category] || CATEGORY_METADATA.other;
                            return (
                              <span
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.badgeClass}`}
                              >
                                <span>{t.title}</span>
                                <span className="font-mono opacity-80">~{t.approx_duration_minutes}m</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* User reflection / AI summary snippet */}
                      {sess.ai_debrief?.summary && (
                        <p className="text-xs text-slate-400 bg-surface-subtle p-2.5 rounded-xl border border-border/60 italic">
                          &ldquo;{sess.ai_debrief.summary}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Start Session Modal */}
      <SessionStartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />

      {/* End Session & AI Debrief Modal */}
      <SessionEndDebriefModal
        isOpen={isDebriefModalOpen}
        onClose={() => setIsDebriefModalOpen(false)}
      />

      {/* Inspected Session Detail Modal */}
      {inspectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-7 border border-border shadow-2xl relative max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: inspectedSession.subject?.color || "#10b981" }}
                />
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {inspectedSession.subject?.name}
                  </span>
                  <h3 className="text-base font-bold text-white">{inspectedSession.topic}</h3>
                </div>
              </div>
              <button
                onClick={() => setInspectedSession(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 my-5">
              {/* Duration split */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-surface-card border border-border">
                  <span className="text-[10px] text-slate-400 block">Gross Time</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {Math.round(inspectedSession.gross_duration_seconds / 60)}m
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-focus/15 border border-focus/30">
                  <span className="text-[10px] text-focus block">Net Focus</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {Math.round(inspectedSession.net_focus_seconds / 60)}m
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-card border border-border">
                  <span className="text-[10px] text-slate-400 block">Focus Score</span>
                  <span className="text-sm font-mono font-bold text-focus">
                    {inspectedSession.focus_score}/100
                  </span>
                </div>
              </div>

              {/* AI Debrief */}
              {inspectedSession.ai_debrief && (
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-focus uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Cognitive Debrief</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {inspectedSession.ai_debrief.summary}
                  </p>
                  <p className="text-xs text-amber-300/90 pt-1 border-t border-border/60">
                    <strong>Distraction Audit:</strong> {inspectedSession.ai_debrief.primaryDistractionDiagnosis}
                  </p>
                </div>
              )}

              {/* Mind Pings list */}
              {inspectedSession.thoughts && inspectedSession.thoughts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Logged Mind Pings ({inspectedSession.thoughts.length})
                  </h4>
                  <div className="space-y-1.5">
                    {inspectedSession.thoughts.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-surface-card border border-border/70 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{t.title}</span>
                        <span className="text-amber-400 font-mono font-semibold">
                          ~{t.approx_duration_minutes}m lost
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Note */}
              {inspectedSession.session_notes && (
                <div className="p-3 rounded-xl bg-surface-subtle border border-border text-xs text-slate-300">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase mb-0.5">
                    Personal Reflection:
                  </span>
                  {inspectedSession.session_notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
