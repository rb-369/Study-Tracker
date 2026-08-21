"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, AlertCircle, ArrowUpRight, CheckCircle2, Copy, Check } from "lucide-react";
import { WeeklyAIReport, AnalyticsSummary } from "@/types";

interface WeeklyAIReportCardProps {
  summary: AnalyticsSummary;
}

export function WeeklyAIReportCard({ summary }: WeeklyAIReportCardProps) {
  const [report, setReport] = useState<WeeklyAIReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyReportSummary = () => {
    if (!report) return;
    const text = `StudyFlow AI Weekly Cognitive Review:\n\n${report.executiveSummary}\n\n• Peak Flow: ${report.peakFocusDay} at ${report.peakFocusHour}\n• Flow State Rate: ${report.flowStateAchievementPercentage}%\n• Top Distraction: ${report.topDistractionCategory}\n\nStrategic Protocols:\n${report.strategicRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-[#121215] border border-indigo-500/25 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 tracking-wider">
                  AI Deep Work Synthesis
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Cognitive Review
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                Cognitive Performance & Strategic Pacing Review
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={copyReportSummary}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Digest"}</span>
              </button>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98] flex items-center gap-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>
                {isLoading
                  ? "Synthesizing Analytics..."
                  : report
                  ? "Regenerate AI Report"
                  : "Generate Weekly AI Report"}
              </span>
            </button>
          </div>
        </div>

        {/* If no report generated yet */}
        {!report && !isLoading && (
          <div className="py-8 text-center max-w-md mx-auto space-y-3">
            <TrendingUp className="w-8 h-8 text-indigo-400 mx-auto" />
            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
              Get an executive AI evaluation of your focus ratio, attention leak bottlenecks, chronotype pacing, and strategic recommendations.
            </p>
            <button
              onClick={handleGenerateReport}
              className="px-5 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold transition-all"
            >
              Analyze My Week
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">
              Running deep work diagnostic across {summary.completedSessionsCount} sessions...
            </p>
          </div>
        )}

        {/* Report Content */}
        {report && !isLoading && (
          <div className="space-y-6 animate-slide-up">
            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Peak Flow Day</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{report.peakFocusDay}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Peak Flow Time</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{report.peakFocusHour}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Primary Trigger</span>
                <span className="text-sm font-bold text-amber-400 font-mono truncate block">{report.topDistractionCategory}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Flow State Rate</span>
                <span className="text-sm font-bold text-indigo-400 font-mono">{report.flowStateAchievementPercentage}%</span>
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
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-200">
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
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Strategic Protocol Recommendations</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.strategicRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 leading-relaxed"
                  >
                    <span className="font-mono font-bold text-indigo-400 block mb-1">
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
