"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, AlertCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { WeeklyAIReport, AnalyticsSummary } from "@/types";

interface WeeklyAIReportCardProps {
  summary: AnalyticsSummary;
}

export function WeeklyAIReportCard({ summary }: WeeklyAIReportCardProps) {
  const [report, setReport] = useState<WeeklyAIReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const topDistractions = summary.categoryWiseDistractions.map((d) => ({
        category: d.label,
        count: d.count,
        totalMinutes: d.totalMinutes,
      }));

      const subjectAllocation = summary.subjectWiseMinutes.map((s) => ({
        name: s.subjectName,
        hours: Number((s.netMinutes / 60).toFixed(1)),
      }));

      const res = await fetch("/api/ai/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionsCount: summary.completedSessionsCount,
          totalGrossHours: Number((summary.totalGrossMinutes / 60).toFixed(1)),
          totalNetHours: Number((summary.totalNetMinutes / 60).toFixed(1)),
          overallFocusRatio: summary.overallFocusRatio,
          topDistractions,
          subjectAllocation,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error("Failed to generate weekly report:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-deepwork/30 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-deepwork/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-deepwork/15 border border-deepwork/30 flex items-center justify-center text-deepwork-light">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-deepwork-light tracking-wider">
                  AI Deep Work Synthesis
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-deepwork/20 text-deepwork-light border border-deepwork/30 font-semibold">
                  Weekly Digest
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Cognitive Performance & Pacing Review
              </h3>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-deepwork hover:bg-deepwork-light text-white text-xs font-bold transition-all shadow-lg shadow-deepwork/25 active:scale-[0.98] flex items-center gap-2"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Synthesizing Analytics..." : report ? "Regenerate AI Report" : "Generate Weekly AI Report"}</span>
          </button>
        </div>

        {/* If no report generated yet */}
        {!report && !isLoading && (
          <div className="py-8 text-center max-w-md mx-auto space-y-3">
            <TrendingUp className="w-8 h-8 text-deepwork-light mx-auto" />
            <p className="text-sm text-slate-300 font-medium">
              Get an executive AI evaluation of your focus ratio, distraction bottlenecks, and pacing recommendations.
            </p>
            <button
              onClick={handleGenerateReport}
              className="px-5 py-2.5 rounded-xl bg-deepwork/20 border border-deepwork/40 hover:bg-deepwork/30 text-deepwork-light text-xs font-bold transition-all"
            >
              Analyze My Week
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-deepwork border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400 font-mono">
              Running deep work diagnostic across {summary.completedSessionsCount} sessions...
            </p>
          </div>
        )}

        {/* Report Content */}
        {report && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border">
              <p className="text-sm text-slate-200 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-surface-card border border-border/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Flow Day</span>
                <span className="text-sm font-bold text-focus">{report.peakFocusDay}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-border/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Flow Time</span>
                <span className="text-sm font-bold text-focus">{report.peakFocusHour}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-border/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Trigger</span>
                <span className="text-sm font-bold text-amber-400">{report.topDistractionCategory}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-border/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Flow State Rate</span>
                <span className="text-sm font-bold text-deepwork-light">{report.flowStateAchievementPercentage}%</span>
              </div>
            </div>

            {/* Strengths & Growth Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cognitive Strengths</span>
                </div>
                <div className="space-y-2">
                  {report.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Areas */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Attention Leaks & Growth</span>
                </div>
                <div className="space-y-2">
                  {report.growthAreas.map((g, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-deepwork-light" />
                <span>Strategic Protocol Recommendations for Next Week</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.strategicRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="font-mono font-bold text-deepwork-light block mb-1">
                      Protocol #{idx + 1}
                    </span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
