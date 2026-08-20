"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BarChart3, TrendingUp, Brain, Clock, Zap, Target, Play } from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionStartModal } from "@/components/session/SessionStartModal";
import { FocusMetricsGrid } from "@/components/analytics/FocusMetricsGrid";
import { FocusTrendsChart } from "@/components/analytics/FocusTrendsChart";
import { DistractionAnalysisCard } from "@/components/analytics/DistractionAnalysisCard";
import { TimeOfDayHeatmap } from "@/components/analytics/TimeOfDayHeatmap";
import { WeeklyAIReportCard } from "@/components/analytics/WeeklyAIReportCard";
import { computeAnalyticsSummary } from "@/lib/analytics/metrics";
import { formatMinutesToDisplay } from "@/lib/utils";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessions } = useStudyStore();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

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
          <p className="text-xs font-mono text-zinc-500">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const summary = computeAnalyticsSummary(sessions);
  const hasSessions = sessions.length > 0 && summary.completedSessionsCount > 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Desktop Sidebar */}
      <Sidebar onOpenNewSession={() => setIsStartModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar onOpenNewSession={() => setIsStartModalOpen(true)} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                  Deep Work Intelligence
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-0.5">
                Focus Analytics & Mind Ping Audit
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Audit raw clock hours against genuine net focused cognition.
              </p>
            </div>

            <button
              onClick={() => setIsStartModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>New Session</span>
            </button>
          </div>

          {!hasSessions ? (
            /* Empty state when 0 sessions logged */
            <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-12 text-center max-w-xl mx-auto my-12 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">
                No Analytics Data Yet
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                As soon as you complete your first study session and log in-session mind pings, your Focus Ratio trends, distraction breakdowns, and circadian heatmaps will automatically appear here.
              </p>
              <button
                onClick={() => setIsStartModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                Start First Session
              </button>
            </div>
          ) : (
            <>
              {/* 1. Focus Summary Metrics Grid */}
              <FocusMetricsGrid summary={summary} />

              {/* 2. Daily Trends Stacked Bar Chart */}
              <FocusTrendsChart data={summary.dailyTrends} />

              {/* 3. Distraction Breakdown + Circadian Rhythm Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistractionAnalysisCard distractions={summary.categoryWiseDistractions} />
                <TimeOfDayHeatmap data={summary.hourlyHeatmap} />
              </div>

              {/* 4. Subject Time Allocation Breakdown */}
              {summary.subjectWiseMinutes.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">
                      Subject Net Focus Allocation
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Net focus time per coursework unit (excluding stray mind pings)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {summary.subjectWiseMinutes.map((sub) => {
                      const netHours = (sub.netMinutes / 60).toFixed(1);
                      const grossHours = (sub.grossMinutes / 60).toFixed(1);
                      const ratio = sub.grossMinutes > 0 ? (sub.netMinutes / sub.grossMinutes) * 100 : 100;

                      return (
                        <div
                          key={sub.subjectId}
                          className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: sub.color || "#10b981" }}
                            />
                            <span className="text-xs font-semibold text-zinc-200 truncate">
                              {sub.subjectName}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono font-bold text-zinc-100">
                              {netHours}h <span className="text-[10px] text-zinc-500 font-normal">net</span>
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400">
                              {Math.round(ratio)}% ratio
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Weekly AI Cognitive Report Card */}
              <WeeklyAIReportCard summary={summary} />
            </>
          )}
        </main>
      </div>

      {/* Start Focus Modal */}
      <SessionStartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />

      {/* Mobile Nav */}
      <MobileNav onOpenNewSession={() => setIsStartModalOpen(true)} />
    </div>
  );
}
