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
  Plus, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  Target
} from "lucide-react";
import Link from "next/link";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiveSessionTimer } from "@/components/session/LiveSessionTimer";
import { SessionStartModal } from "@/components/session/SessionStartModal";
import { SessionEndDebriefModal } from "@/components/session/SessionEndDebriefModal";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import { computeAnalyticsSummary } from "@/lib/analytics/metrics";
import { formatMinutesToDisplay, CATEGORY_METADATA } from "@/lib/utils";
import { StudySession } from "@/types";
import { IncomingBuddyInviteBanner } from "@/components/social/IncomingBuddyInviteBanner";
import { StudyBuddySyncModal } from "@/components/social/StudyBuddySyncModal";
import { BuddySession } from "@/types/social";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, activeSession, sessions, subjects, goals, createSubject, startSession } = useStudyStore();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [activeBuddySession, setActiveBuddySession] = useState<BuddySession | null>(null);

  // Auth gate check
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
          <p className="text-xs font-mono text-zinc-500">Loading StudyFlow...</p>
        </div>
      </div>
    );
  }

  const summary = computeAnalyticsSummary(sessions);

  // Calculate today's net minutes from completed sessions
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter(
    (s) => s.status === "completed" && s.start_time.startsWith(todayStr)
  );
  const todayNetMinutes = todaySessions.reduce(
    (acc, s) => acc + Math.round(s.net_focus_seconds / 60),
    0
  );
  const dailyTargetMinutes = user?.target_daily_minutes || 120;
  const todayProgressPercent = Math.min(100, Math.round((todayNetMinutes / dailyTargetMinutes) * 100));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Desktop Sidebar */}
      <Sidebar 
        onOpenNewSession={() => setIsStartModalOpen(true)} 
        onOpenNewSubject={() => setIsNewSubjectModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar onOpenNewSession={() => setIsStartModalOpen(true)} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Focus Console
                </h1>
                <span className="text-xs text-zinc-500 font-mono">
                  &bull; {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Audit real deep work time against raw clock time with 1-tap mind pings.
              </p>
            </div>

            {!activeSession && (
              <button
                onClick={() => setIsStartModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Start Focus Session</span>
              </button>
            )}
          </div>

          {/* Laptop / Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Center Stage Focus Console (8 Columns on Desktop) */}
            <div className="lg:col-span-8 space-y-6">
              {activeSession ? (
                <LiveSessionTimer onEndSessionClick={() => setIsDebriefModalOpen(true)} />
              ) : (
                /* Ready State Console */
                <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                        Ready to Focus
                      </span>
                      <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                        No active timer running
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 max-w-md">
                        Resume your last deep work block in 1 tap, or customize a new sprint.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                      {/* 1-Tap Quick Resume Last Session */}
                      {sessions && sessions.length > 0 && (
                        <button
                          onClick={() => {
                            const last = sessions[0];
                            startSession(
                              last.subject_id,
                              last.topic || "Deep Study Block",
                              last.session_type || "pomodoro",
                              25,
                              last.goal_id
                            );
                          }}
                          className="flex-1 lg:flex-initial px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                          title={`Instantly resume ${sessions[0].subject?.name || "Subject"}: ${sessions[0].topic}`}
                        >
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Resume {sessions[0].subject?.name || "Last Block"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsStartModalOpen(true)}
                        className="flex-1 lg:flex-initial px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Play className="w-4 h-4 fill-zinc-950" />
                        <span>Start Focus Block</span>
                      </button>
                    </div>
                  </div>

                  {/* Daily Target Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400 font-medium">Today&apos;s Focus Goal</span>
                      <span className="font-mono text-zinc-200">
                        {todayNetMinutes}m / {dailyTargetMinutes}m ({todayProgressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${todayProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Core Metric Glance Cards */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
                      <span className="text-[10px] uppercase font-mono text-zinc-500">Today Focused</span>
                      <div className="text-base sm:text-lg font-bold text-zinc-100 font-mono mt-0.5">
                        {todayNetMinutes > 0 ? formatMinutesToDisplay(todayNetMinutes) : "0m"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
                      <span className="text-[10px] uppercase font-mono text-zinc-500">All-Time Net</span>
                      <div className="text-base sm:text-lg font-bold text-zinc-100 font-mono mt-0.5">
                        {summary.totalNetMinutes > 0 
                          ? formatMinutesToDisplay(summary.totalNetMinutes) 
                          : "0m"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
                      <span className="text-[10px] uppercase font-mono text-zinc-500">Focus Ratio</span>
                      <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5">
                        {summary.completedSessionsCount > 0 
                          ? `${Math.round(summary.overallFocusRatio * 100)}%` 
                          : "100%"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Today's Completed Sessions Feed */}
              <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-zinc-100">Today&apos;s Flow Timeline</h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    {todaySessions.length} completed
                  </span>
                </div>

                {todaySessions.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-zinc-400">
                      No study sessions completed today yet.
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      Start a focus block above to record your first deep work session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {todaySessions.map((s) => {
                      const netMins = Math.round(s.net_focus_seconds / 60);
                      const grossMins = Math.round(s.gross_duration_seconds / 60);
                      const thoughtsCount = s.thoughts?.length || 0;
                      return (
                        <div
                          key={s.id}
                          className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: s.subject?.color || "#10b981" }}
                            />
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-200 truncate">
                                  {s.topic}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {s.subject?.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                                <span>{netMins}m net focus</span>
                                <span>&bull;</span>
                                <span>{thoughtsCount} mind pings</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {s.focus_score}/100
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Right Rail (4 Columns on Desktop) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Active Exam Goals Widget */}
              <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Active Exam Goals
                    </h3>
                  </div>
                  <Link
                    href="/goals"
                    className="text-[11px] text-emerald-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <span>View Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {goals.filter(g => g.status === 'active' || !g.status).length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-xs text-zinc-400">No exam goals active</p>
                    <Link
                      href="/goals"
                      className="mt-2 inline-block text-xs font-medium text-emerald-400 hover:underline"
                    >
                      + Set up Final Exam / PT Goal
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 mt-3.5">
                    {goals.filter(g => g.status === 'active' || !g.status).slice(0, 3).map((g) => {
                      const goalSessions = sessions.filter(s => s.goal_id === g.id && s.status === 'completed');
                      const gNetMins = goalSessions.reduce((acc, s) => acc + Math.round(s.net_focus_seconds / 60), 0);
                      const gTargetMins = Math.max(1, Math.round(g.target_total_hours * 60));
                      const gPct = Math.min(100, Math.round((gNetMins / gTargetMins) * 100));

                      return (
                        <Link
                          key={g.id}
                          href="/goals"
                          className="block p-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 transition-all group"
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-zinc-200 group-hover:text-emerald-400 truncate">
                              {g.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {formatMinutesToDisplay(gNetMins)} / {g.target_total_hours}h
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${gPct}%` }}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Enrolled Courses / Subject Targets */}
              <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Subject Targets
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsNewSubjectModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                {subjects.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-zinc-400">No subjects configured</p>
                    <button
                      onClick={() => setIsNewSubjectModalOpen(true)}
                      className="mt-2 text-xs font-medium text-emerald-400 hover:underline"
                    >
                      + Create first subject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-3.5">
                    {subjects.map((sub) => {
                      const subSessions = sessions.filter(
                        (s) => s.subject_id === sub.id && s.status === "completed"
                      );
                      const totalSubMins = subSessions.reduce(
                        (acc, s) => acc + Math.round(s.net_focus_seconds / 60),
                        0
                      );
                      const targetWeeklyMins = (sub.target_weekly_hours || 10) * 60;
                      const progressPct = Math.min(100, Math.round((totalSubMins / targetWeeklyMins) * 100));

                      return (
                        <div key={sub.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: sub.color || "#10b981" }}
                              />
                              <span className="font-medium text-zinc-300 truncate">
                                {sub.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {formatMinutesToDisplay(totalSubMins)} / {sub.target_weekly_hours}h
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: sub.color || "#10b981",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Distraction Quick Audit Card */}
              <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Mind Ping Audit
                  </h3>
                </div>

                <div className="mt-3.5 space-y-2">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    StudyFlow automatically isolates stray thoughts so your focus statistics reflect genuine flow time.
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Total Mind Pings Captured</span>
                    <span className="text-xs font-mono font-bold text-zinc-200">
                      {summary.totalThoughtsLogged}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Start Focus Modal */}
      <SessionStartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />

      {/* End Session Debrief Modal */}
      <SessionEndDebriefModal
        isOpen={isDebriefModalOpen}
        onClose={() => setIsDebriefModalOpen(false)}
      />

      {/* Add Subject Modal */}
      {isNewSubjectModalOpen && (
        <SubjectManager onClose={() => setIsNewSubjectModalOpen(false)} />
      )}

      {/* Incoming Buddy Invite (Distraction-Shield: Only visible when idle or in a Pomodoro break) */}
      <IncomingBuddyInviteBanner
        currentUser={user}
        onAcceptInvite={(session) => {
          setActiveBuddySession(session);
        }}
      />

      {/* Synchronized 1-on-1 Buddy Session Modal */}
      {activeBuddySession && (
        <StudyBuddySyncModal
          isOpen={!!activeBuddySession}
          onClose={() => setActiveBuddySession(null)}
          currentUser={user!}
          targetFriend={activeBuddySession.buddy?.id === user?.id ? activeBuddySession.initiator : activeBuddySession.buddy}
          existingSession={activeBuddySession}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenNewSession={() => setIsStartModalOpen(true)} />
    </div>
  );
}
