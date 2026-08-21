"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Brain,
  Clock,
  Zap,
  Target,
  Play,
  Download,
  Share2,
  Check,
  Calendar,
} from "lucide-react";
import { useStudyStore } from "@/lib/store/useStudyStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionStartModal } from "@/components/session/SessionStartModal";
import { FocusMetricsGrid } from "@/components/analytics/FocusMetricsGrid";
import { FocusTrendsChart } from "@/components/analytics/FocusTrendsChart";
import { DistractionAnalysisCard } from "@/components/analytics/DistractionAnalysisCard";
import { FlowStateDistributionCard } from "@/components/analytics/FlowStateDistributionCard";
import { TimeOfDayHeatmap } from "@/components/analytics/TimeOfDayHeatmap";
import { SessionHistoryTable } from "@/components/analytics/SessionHistoryTable";
import { WeeklyAIReportCard } from "@/components/analytics/WeeklyAIReportCard";
import { computeAnalyticsSummary } from "@/lib/analytics/metrics";
import { exportSessionsToCSV, formatMinutesToDisplay } from "@/lib/utils";
import { AnalyticsTimeframe } from "@/types";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessions, subjects } = useStudyStore();
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>("7d");
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  const summary = computeAnalyticsSummary(sessions, timeframe);
  const hasSessions = sessions.length > 0 && summary.completedSessionsCount > 0;

  const handleExportCSV = () => {
    exportSessionsToCSV(sessions);
  };

  const handleCopyQuickSummary = () => {
    const text = `StudyFlow Analytics Summary (${timeframe.toUpperCase()}):\n• Net Focus Time: ${(summary.totalNetMinutes / 60).toFixed(1)}h\n• Focus Efficiency Ratio: ${(summary.overallFocusRatio * 100).toFixed(0)}%\n• Completed Blocks: ${summary.completedSessionsCount}\n• Distractions Logged: ${summary.totalThoughtsLogged} (${summary.pingsPerHour}/hr)\n• Longest Deep Streak: ${formatMinutesToDisplay(summary.longestDeepWorkStreakMinutes)}\n• Daily Streak: ${summary.currentStreakDays} days`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const timeframeOptions: { key: AnalyticsTimeframe; label: string }[] = [
    { key: "7d", label: "7 Days" },
    { key: "14d", label: "14 Days" },
    { key: "30d", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-mono text-zinc-500">
                  {summary.completedSessionsCount} blocks analyzed
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-0.5">
                Focus Analytics & Mind Ping Audit
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Audit raw clock hours against genuine net focused cognition, attention leaks, and circadian rhythm.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Timeframe Selector Segmented Control */}
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTimeframe(opt.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      timeframe === opt.key
                        ? "bg-emerald-500 text-zinc-950 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleCopyQuickSummary}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5"
                title="Copy quick summary to clipboard"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? "Copied" : "Share"}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5"
                title="Export study data as CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setIsStartModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-zinc-950" />
                <span>New Session</span>
              </button>
            </div>
          </div>

          {!hasSessions ? (
            /* Empty state when 0 sessions logged */
            <div className="rounded-2xl bg-[#121215] border border-zinc-800 p-12 text-center max-w-xl mx-auto my-12 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">
                No Analytics Data For This Window
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                As soon as you complete study sessions and log in-session mind pings, your Focus Ratio trends, distraction root causes, flow state distributions, and circadian heatmaps will automatically appear here.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {timeframe !== "all" && (
                  <button
                    onClick={() => setTimeframe("all")}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
                  >
                    View All Time
                  </button>
                )}
                <button
                  onClick={() => setIsStartModalOpen(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  Start Focus Session
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Focus Summary Metrics Grid */}
              <FocusMetricsGrid summary={summary} />

              {/* 2. Daily Trends Stacked Bar Chart & Score Trend */}
              <FocusTrendsChart data={summary.dailyTrends} />

              {/* 3. Distraction Breakdown + Flow State Distribution Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistractionAnalysisCard
                  distractions={summary.categoryWiseDistractions}
                  topTitles={summary.topThoughtTitles}
                />
                <FlowStateDistributionCard
                  distribution={summary.flowStateDistribution}
                  totalSessions={summary.completedSessionsCount}
                />
              </div>

              {/* 4. Circadian Rhythm Heatmap & Peak Flow Window */}
              <TimeOfDayHeatmap data={summary.hourlyHeatmap} />

              {/* 5. Subject Time Allocation Breakdown */}
              {summary.subjectWiseMinutes.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">
                        Subject Net Focus Allocation
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Net focus time per coursework unit (excluding stray mind pings)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {summary.subjectWiseMinutes.map((sub) => {
                      const netHours = (sub.netMinutes / 60).toFixed(1);
                      const grossHours = (sub.grossMinutes / 60).toFixed(1);
                      const ratio = sub.grossMinutes > 0 ? (sub.netMinutes / sub.grossMinutes) * 100 : 100;

                      return (
                        <div
                          key={sub.subjectId}
                          className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 hover:border-zinc-700 transition-colors"
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

                          <div className="flex items-baseline justify-between font-mono">
                            <span className="text-sm font-bold text-zinc-100">
                              {netHours}h <span className="text-[10px] text-zinc-500 font-normal">net</span>
                            </span>
                            <span className="text-[11px] text-emerald-400 font-medium">
                              {Math.round(ratio)}% ratio
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. Filterable & Searchable Session Logs & Focus Timeline */}
              <SessionHistoryTable
                sessions={sessions}
                subjects={subjects}
              />

              {/* 7. Weekly AI Cognitive Report Card */}
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
