"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BarChart3, TrendingUp, Brain, Clock, Zap, Target } from "lucide-react";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-focus border-t-transparent animate-spin" />
      </div>
    );
  }

  const summary = computeAnalyticsSummary(sessions);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <Sidebar onOpenNewSession={() => setIsStartModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Navbar onOpenNewSession={() => setIsStartModalOpen(true)} />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-focus tracking-wider">
                  Deep Work Intelligence
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                Focus Analytics & Mind Ping Audit
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Isolate gross clock hours from true net focused cognition across all subjects
              </p>
            </div>
          </div>

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
          <div className="p-5 sm:p-6 rounded-2xl glass-card border border-border space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Subject-Wise Net Focus Allocation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hours spent per coursework unit (excluding in-session mind pings)
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
                    className="p-4 rounded-xl bg-surface-elevated/50 border border-border/80 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {sub.subjectName}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-lg font-mono font-bold text-white">
                        {netHours}h
                      </span>
                      <span className="text-[11px] font-mono text-focus font-semibold">
                        {ratio.toFixed(0)}% focus
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono">
                      {grossHours}h gross clock time
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Weekly AI Cognitive Digest */}
          <WeeklyAIReportCard summary={summary} />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Start Session Modal */}
      <SessionStartModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />
    </div>
  );
}
